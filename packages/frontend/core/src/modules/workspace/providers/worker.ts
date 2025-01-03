import type {
  WorkerClient,
  WorkerInitOptions,
} from '@affine/nbstore/worker/client';
import { createIdentifier } from '@toeverything/infra';

export interface WorkspaceEngineWorkerProvider {
  openWorker(options: WorkerInitOptions): {
    client: WorkerClient;
    dispose: () => void;
  };
}

export const WorkspaceEngineWorkerProvider =
  createIdentifier<WorkspaceEngineWorkerProvider>(
    'WorkspaceEngineWorkerProvider'
  );
