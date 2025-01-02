import {
  type ExternalGetDataFeedbackArgs,
  type fromExternalData,
  type toExternalData,
} from '@affine/component';
import { createPageModeSpecs } from '@affine/core/components/blocksuite/block-suite-editor/specs/page';
import type { AffineDNDData } from '@affine/core/types/dnd';
import { BlockStdScope } from '@blocksuite/affine/block-std';
import { DndApiExtensionIdentifier } from '@blocksuite/affine/blocks';
import { type SliceSnapshot } from '@blocksuite/affine/store';
import { Service } from '@toeverything/infra';

import type { DocsService } from '../../doc';
import { resolveLinkToDoc } from '../../navigation';
import type { WorkspaceService } from '../../workspace';

type Entity = AffineDNDData['draggable']['entity'];
type EntityResolver = (data: string) => Entity | null;

type ExternalDragPayload = ExternalGetDataFeedbackArgs['source'];

export class DndService extends Service {
  constructor(
    private readonly docsService: DocsService,
    private readonly workspaceService: WorkspaceService
  ) {
    super();

    // order matters
    this.resolvers.push(this.resolveBlocksuiteExternalData);

    const mimeResolvers: [string, EntityResolver][] = [
      ['text/html', this.resolveHTML],
      ['text/uri-list', this.resolveUriList],
    ];

    mimeResolvers.forEach(([type, resolver]) => {
      this.resolvers.push((source: ExternalDragPayload) => {
        if (source.types.includes(type)) {
          const stringData = source.getStringData(type);
          if (stringData) {
            const entity = resolver(stringData);
            if (entity) {
              return {
                entity,
                from: {
                  at: 'external',
                },
              };
            }
          }
        }
        return null;
      });
    });
  }

  private readonly resolvers: ((
    source: ExternalDragPayload
  ) => AffineDNDData['draggable'] | null)[] = [];

  getBlocksuiteDndAPI(sourceDocId?: string) {
    const collection = this.workspaceService.workspace.docCollection;
    sourceDocId ??= collection.docs.keys().next().value;
    const doc = sourceDocId ? collection.getDoc(sourceDocId) : null;

    if (!doc) {
      return null;
    }

    const std = new BlockStdScope({
      doc,
      extensions: createPageModeSpecs(this.framework),
    });
    const dndAPI = std.get(DndApiExtensionIdentifier);
    return dndAPI;
  }

  fromExternalData: fromExternalData<AffineDNDData> = (
    args: ExternalGetDataFeedbackArgs,
    isDropEvent?: boolean
  ) => {
    if (!isDropEvent) {
      return this.resolveBlocksuiteExternalData(args.source) || {};
    }

    let resolved: AffineDNDData['draggable'] | null = null;

    // in the order of the resolvers instead of the order of the types
    for (const resolver of this.resolvers) {
      const candidate = resolver(args.source);
      if (candidate) {
        resolved = candidate;
        break;
      }
    }

    if (!resolved) {
      return {}; // no resolver can handle this data
    }

    return resolved;
  };

  toExternalData: toExternalData<AffineDNDData> = (args, data) => {
    const normalData = typeof data === 'function' ? data(args) : data;

    if (
      !normalData ||
      !normalData.entity ||
      normalData.entity.type !== 'doc' ||
      !normalData.entity.id
    ) {
      return {};
    }

    const dndAPI = this.getBlocksuiteDndAPI(normalData.entity.id);

    if (!dndAPI) {
      return {};
    }

    const snapshotSlice = dndAPI.fromEntity({
      docId: normalData.entity.id,
      flavour: 'affine:embed-linked-doc',
    });

    if (!snapshotSlice) {
      return {};
    }

    const encoded = dndAPI.encodeSnapshot(snapshotSlice);

    return {
      [dndAPI.mimeType]: encoded,
    };
  };

  private readonly resolveUriList: EntityResolver = urls => {
    // only deal with the first url
    const url = urls
      ?.split('\n')
      .filter(u => u.trim() && !u.trim().startsWith('#'))[0];

    if (url) {
      const maybeDocLink = resolveLinkToDoc(url);

      // check if the doc is in the current workspace
      if (
        maybeDocLink?.workspaceId === this.workspaceService.workspace.id &&
        this.docsService.list.doc$(maybeDocLink.docId).value &&
        // skip for block references for now
        !maybeDocLink.blockIds?.length
      ) {
        return {
          type: 'doc',
          id: maybeDocLink.docId,
        };
      }
    }
    return null;
  };

  private readonly resolveBlocksuiteExternalData = (
    source: ExternalDragPayload
  ): AffineDNDData['draggable'] | null => {
    const dndAPI = this.getBlocksuiteDndAPI();
    if (!dndAPI) {
      return null;
    }

    if (source.types.includes(dndAPI.mimeType)) {
      const from = {
        at: 'blocksuite-editor',
      } as const;

      let entity: Entity | null = null;

      const encoded = source.getStringData(dndAPI.mimeType);
      const snapshot = encoded ? dndAPI.decodeSnapshot(encoded) : null;
      entity = snapshot ? this.resolveBlockSnapshot(snapshot) : null;

      if (!entity) {
        return {
          from,
        };
      } else {
        return {
          entity,
          from,
        };
      }
    }
    return null;
  };

  private readonly resolveHTML: EntityResolver = html => {
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      // If drag from another secure context, the url-list
      // will be "about:blank#blocked"
      // We can still infer the url-list from the anchor tags
      const urls = Array.from(doc.querySelectorAll('a'))
        .map(a => a.href)
        .join('\n');
      return this.resolveUriList(urls);
    } catch {
      // ignore the error
      return null;
    }
  };

  private readonly resolveBlockSnapshot = (
    snapshot: SliceSnapshot
  ): Entity | null => {
    for (const block of snapshot.content) {
      if (
        ['affine:embed-linked-doc', 'affine:embed-synced-doc'].includes(
          block.flavour
        )
      ) {
        return {
          type: 'doc',
          id: block.props.pageId as string,
        };
      }
    }
    return null;
  };
}
