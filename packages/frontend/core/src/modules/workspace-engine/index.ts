import { type Framework } from '@toeverything/infra';

import { ServersService } from '../cloud/services/servers';
import { DesktopApiService } from '../desktop-api';
import { GlobalState } from '../storage';
import { WorkspaceFlavoursProvider } from '../workspace';
import { CloudWorkspaceFlavoursProvider } from './impls/cloud';
import { IndexedDBBlobStorage } from './impls/engine/blob-indexeddb';
import { SqliteBlobStorage } from './impls/engine/blob-sqlite';
import { IndexedDBDocStorage } from './impls/engine/doc-indexeddb';
import { SqliteDocStorage } from './impls/engine/doc-sqlite';
import {
  LOCAL_WORKSPACE_LOCAL_STORAGE_KEY,
  LocalWorkspaceFlavoursProvider,
} from './impls/local';
import { WorkspaceEngineStorageProvider } from './providers/engine';

export { CloudBlobStorage } from './impls/engine/blob-cloud';
export { base64ToUint8Array, uint8ArrayToBase64 } from './utils/base64';

export function configureBrowserWorkspaceFlavours(framework: Framework) {
  framework
    .impl(WorkspaceFlavoursProvider('LOCAL'), LocalWorkspaceFlavoursProvider)
    .impl(WorkspaceFlavoursProvider('CLOUD'), CloudWorkspaceFlavoursProvider, [
      GlobalState,
      ServersService,
    ]);
}

export function configureIndexedDBWorkspaceEngineStorageProvider(
  framework: Framework
) {
  framework.impl(WorkspaceEngineStorageProvider, {
    getDocStorage(workspaceId: string) {
      return new IndexedDBDocStorage(workspaceId);
    },
    getBlobStorage(workspaceId: string) {
      return new IndexedDBBlobStorage(workspaceId);
    },
  });
}

export function configureSqliteWorkspaceEngineStorageProvider(
  framework: Framework
) {
  framework.impl(WorkspaceEngineStorageProvider, p => {
    const electronApi = p.get(DesktopApiService);
    return {
      getDocStorage(workspaceId: string) {
        return new SqliteDocStorage(workspaceId, electronApi);
      },
      getBlobStorage(workspaceId: string) {
        return new SqliteBlobStorage(workspaceId, electronApi);
      },
    };
  });
}

/**
 * a hack for directly add local workspace to workspace list
 * Used after copying sqlite database file to appdata folder
 */
export function _addLocalWorkspace(id: string) {
  const allWorkspaceIDs: string[] = JSON.parse(
    localStorage.getItem(LOCAL_WORKSPACE_LOCAL_STORAGE_KEY) ?? '[]'
  );
  allWorkspaceIDs.push(id);
  localStorage.setItem(
    LOCAL_WORKSPACE_LOCAL_STORAGE_KEY,
    JSON.stringify(allWorkspaceIDs)
  );
}
