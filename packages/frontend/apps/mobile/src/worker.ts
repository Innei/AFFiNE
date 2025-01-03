import '@affine/core/bootstrap/browser';

import {
  WorkerConsumer,
  type WorkerOps,
} from '@affine/nbstore/worker/consumer';
import { type MessageCommunicapable, OpConsumer } from '@toeverything/infra/op';

const consumer = new OpConsumer<WorkerOps>(globalThis as MessageCommunicapable);

new WorkerConsumer(consumer);
