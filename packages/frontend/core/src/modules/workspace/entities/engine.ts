import type {
  WorkerClient,
  WorkerInitOptions,
} from '@affine/nbstore/worker/client';
import { Entity } from '@toeverything/infra';

import { WorkspaceEngineBeforeStart } from '../events';
import type { WorkspaceEngineWorkerProvider } from '../providers/worker';
import type { WorkspaceService } from '../services/workspace';

export class WorkspaceEngine extends Entity<{
  engineWorkerInitOptions: WorkerInitOptions;
}> {
  worker?: WorkerClient;
  started = false;

  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly workerProvider: WorkspaceEngineWorkerProvider
  ) {
    super();
  }

  get doc() {
    if (!this.worker) {
      throw new Error('Engine is not initialized');
    }
    return this.worker.docFrontend;
  }

  get blob() {
    if (!this.worker) {
      throw new Error('Engine is not initialized');
    }
    return this.worker.blobFrontend;
  }

  get awareness() {
    if (!this.worker) {
      throw new Error('Engine is not initialized');
    }
    return this.worker.awarenessFrontend;
  }

  start() {
    if (this.started) {
      throw new Error('Engine is already started');
    }
    this.started = true;

    const { client, dispose } = this.workerProvider.openWorker(
      this.props.engineWorkerInitOptions
    );
    this.worker = client;
    this.disposables.push(dispose);
    this.eventBus.emit(WorkspaceEngineBeforeStart, this);

    const rootDoc = this.workspaceService.workspace.docCollection.doc;
    this.doc.addPriority(rootDoc.guid, 100);
    this.doc.addDoc(rootDoc, true);
    this.doc.start();
    this.disposables.push(() => this.doc.stop());
    this.awareness.connect(this.workspaceService.workspace.awareness);
  }
}
