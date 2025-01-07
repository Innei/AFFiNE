import { applyUpdate, Array as YArray, Doc as YDoc, Map as YMap } from 'yjs';

import { share } from '../../../connection';
import {
  type DocClocks,
  type DocRecord,
  DocStorageBase,
  type DocStorageOptions,
  type DocUpdate,
} from '../../../storage';
import { DocIDBConnection } from './db';

/**
 * @deprecated readonly
 */
export class IndexedDBV1DocStorage extends DocStorageBase {
  static readonly identifier = 'IndexedDBV1DocStorage';

  private cachedIdInfo: Promise<{
    oldIdToNewId: { [oldId: string]: string };
    newIdToOldId: { [newId: string]: string };
    docClocks: DocClocks;
  }> | null = null;
  readonly connection = share(new DocIDBConnection());

  constructor(opts: DocStorageOptions) {
    super({
      ...opts,
      readonlyMode: true,
    });
  }

  get db() {
    return this.connection.inner;
  }

  get name() {
    return 'idb(old)';
  }

  override async getDoc(docId: string) {
    if (!this.db) {
      return null;
    }
    const oldId = (await this.getDocIdInfo()).newIdToOldId[docId];
    const trx = this.db.transaction('workspace', 'readonly');
    const record = await trx.store.get(oldId);

    if (!record?.updates.length) {
      return null;
    }

    if (record.updates.length === 1) {
      return {
        docId,
        bin: record.updates[0].update,
        timestamp: new Date(record.updates[0].timestamp),
      };
    }

    return {
      docId,
      bin: await this.mergeUpdates(record.updates.map(update => update.update)),
      timestamp: new Date(record.updates.at(-1)?.timestamp ?? Date.now()),
    };
  }

  protected override async getDocSnapshot() {
    return null;
  }

  override async pushDocUpdate(update: DocUpdate) {
    // no more writes to old db
    return { docId: update.docId, timestamp: new Date() };
  }

  override async deleteDoc(docId: string) {
    if (!this.db) {
      return;
    }
    const oldId = (await this.getDocIdInfo()).newIdToOldId[docId];
    const trx = this.db.transaction('workspace', 'readwrite');
    await trx.store.delete(oldId);
  }

  override async getDocTimestamps(): Promise<DocClocks> {
    if (!this.db) {
      return {};
    }
    return (await this.getDocIdInfo()).docClocks;
  }

  override async getDocTimestamp(_docId: string) {
    return null;
  }

  protected override async setDocSnapshot(): Promise<boolean> {
    return false;
  }

  protected override async getDocUpdates(): Promise<DocRecord[]> {
    return [];
  }

  protected override async markUpdatesMerged(): Promise<number> {
    return 0;
  }

  private async getDocIdInfo() {
    if (this.cachedIdInfo) {
      return await this.cachedIdInfo;
    }
    this.cachedIdInfo = (async () => {
      if (!this.db) {
        return {
          docClocks: {},
          newIdToOldId: {},
          oldIdToNewId: {},
        };
      }
      try {
        const oldIdToNewId = { [this.spaceId]: this.spaceId };
        const rootDocRecord = await this.getDoc(this.spaceId);
        if (rootDocRecord) {
          const ydoc = new YDoc({
            guid: this.spaceId,
          });
          applyUpdate(ydoc, rootDocRecord.bin);

          // get all ids from rootDoc.meta.pages.[*].id, trust this id as normalized id
          const normalizedDocIds = (
            (ydoc.getMap('meta') as YMap<any> | undefined)?.get('pages') as
              | YArray<YMap<any>>
              | undefined
          )
            ?.map(i => i.get('id') as string)
            .filter(i => !!i);

          const spaces = ydoc.getMap('spaces') as YMap<any> | undefined;
          for (const pageId of normalizedDocIds ?? []) {
            const subdoc = spaces?.get(pageId);
            if (subdoc && subdoc instanceof YDoc) {
              oldIdToNewId[subdoc.guid] = pageId;
            }
          }
          const trx = this.db.transaction('workspace', 'readonly');
          const allKeys = await trx.store.getAllKeys();
          allKeys
            .filter(k => k.startsWith(`db$${this.spaceId}$`))
            .forEach(k => {
              oldIdToNewId[k] = k.replace(`db$${this.spaceId}$`, `db$`);
            });
          allKeys
            .filter(k =>
              k.match(new RegExp(`^userdata\\$[\\w-]+\\$${this.spaceId}$`))
            )
            .forEach(k => {
              oldIdToNewId[k] = k.replace(`$${this.spaceId}$`, '$');
            });

          // create `docClocks` and `newIdToOldId` base on `oldIdToNewId`
          const docClocks: DocClocks = {};
          const newIdToOldId: { [newId: string]: string } = {};
          for (const oldId in oldIdToNewId) {
            const newId = oldIdToNewId[oldId];
            docClocks[newId] = new Date(1);
            newIdToOldId[newId] = oldId;
          }
          return {
            docClocks,
            newIdToOldId,
            oldIdToNewId,
          };
        } else {
          return { docClocks: {}, newIdToOldId: {}, oldIdToNewId: {} };
        }
      } catch (err) {
        console.error('failed to get v1 doc list');
        return { docClocks: {}, newIdToOldId: {}, oldIdToNewId: {} };
      }
    })();

    return await this.cachedIdInfo;
  }
}
