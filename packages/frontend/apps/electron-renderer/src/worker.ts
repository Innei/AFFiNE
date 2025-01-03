import '@affine/core/bootstrap/electron';

import { getElectronAPIs } from '@affine/electron-api/web-worker';
import { bindNativeDBApis } from '@affine/nbstore/sqlite';
import {
  WorkerConsumer,
  type WorkerOps,
} from '@affine/nbstore/worker/consumer';
import { type MessageCommunicapable, OpConsumer } from '@toeverything/infra/op';

const electronAPIs = getElectronAPIs();

bindNativeDBApis(electronAPIs.nbstore);

const consumer = new OpConsumer<WorkerOps>(globalThis as MessageCommunicapable);

new WorkerConsumer(consumer);
