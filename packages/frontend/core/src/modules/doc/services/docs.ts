import { DebugLogger } from '@affine/debug';
import { Unreachable } from '@affine/env/constant';
import type { DocMode } from '@blocksuite/affine/blocks';
import type { DeltaInsert } from '@blocksuite/affine/inline';
import { Text } from '@blocksuite/affine/store';
import type { AffineTextAttributes } from '@blocksuite/affine-shared/types';
import { LiveData, ObjectPool, Service } from '@toeverything/infra';
import { omitBy } from 'lodash-es';
import { combineLatest, map } from 'rxjs';

import {
  type DocProps,
  initDocFromProps,
} from '../../../blocksuite/initialization';
import type { DocProperties } from '../../db';
import type { Doc } from '../entities/doc';
import { DocPropertyList } from '../entities/property-list';
import { DocRecordList } from '../entities/record-list';
import { DocCreated } from '../events';
import { DocScope } from '../scopes/doc';
import type { DocPropertiesStore } from '../stores/doc-properties';
import type { DocsStore } from '../stores/docs';
import { DocService } from './doc';

const logger = new DebugLogger('DocsService');

export class DocsService extends Service {
  list = this.framework.createEntity(DocRecordList);

  pool = new ObjectPool<string, Doc>({
    onDelete(obj) {
      obj.scope.dispose();
    },
  });

  propertyList = this.framework.createEntity(DocPropertyList);

  /**
   * used for search doc by properties, for convenience of search, all non-exist doc or trash doc have been filtered
   */
  allDocProperties$: LiveData<Record<string, DocProperties>> = LiveData.from(
    combineLatest([
      this.docPropertiesStore.watchAllDocProperties(),
      this.store.watchNonTrashDocIds(),
    ]).pipe(
      map(([properties, docIds]) => {
        const allIds = new Set(docIds);
        return omitBy(
          properties as Record<string, DocProperties>,
          (_, id) => !allIds.has(id)
        );
      })
    ),
    {}
  );

  constructor(
    private readonly store: DocsStore,
    private readonly docPropertiesStore: DocPropertiesStore
  ) {
    super();
  }

  open(docId: string) {
    const docRecord = this.list.doc$(docId).value;
    if (!docRecord) {
      throw new Error('Doc record not found');
    }
    const blockSuiteDoc = this.store.getBlockSuiteDoc(docId);
    if (!blockSuiteDoc) {
      throw new Error('Doc not found');
    }

    const exists = this.pool.get(docId);
    if (exists) {
      return { doc: exists.obj, release: exists.release };
    }

    const docScope = this.framework.createScope(DocScope, {
      docId,
      blockSuiteDoc,
      record: docRecord,
    });

    try {
      blockSuiteDoc.load();
    } catch (e) {
      logger.error('Failed to load doc', {
        docId,
        error: e,
      });
    }

    const doc = docScope.get(DocService).doc;

    const { obj, release } = this.pool.put(docId, doc);

    return { doc: obj, release };
  }

  createDoc(
    options: {
      primaryMode?: DocMode;
      docProps?: DocProps;
    } = {}
  ) {
    const doc = this.store.createBlockSuiteDoc();
    initDocFromProps(doc, options.docProps);
    const docRecord = this.list.doc$(doc.id).value;
    if (!docRecord) {
      throw new Unreachable();
    }
    if (options.primaryMode) {
      docRecord.setPrimaryMode(options.primaryMode);
    }
    this.eventBus.emit(DocCreated, docRecord);
    return docRecord;
  }

  async addLinkedDoc(targetDocId: string, linkedDocId: string) {
    const { doc, release } = this.open(targetDocId);
    const disposePriorityLoad = doc.addPriorityLoad(10);
    await doc.waitForSyncReady();
    disposePriorityLoad();
    const text = new Text([
      {
        insert: ' ',
        attributes: {
          reference: {
            type: 'LinkedPage',
            pageId: linkedDocId,
          },
        },
      },
    ] as DeltaInsert<AffineTextAttributes>[]);
    const [frame] = doc.blockSuiteDoc.getBlocksByFlavour('affine:note');
    frame &&
      doc.blockSuiteDoc.addBlock(
        'affine:paragraph' as never, // TODO(eyhn): fix type
        { text },
        frame.id
      );
    release();
  }

  async changeDocTitle(docId: string, newTitle: string) {
    const { doc, release } = this.open(docId);
    const disposePriorityLoad = doc.addPriorityLoad(10);
    await doc.waitForSyncReady();
    disposePriorityLoad();
    doc.changeDocTitle(newTitle);
    release();
  }
}
