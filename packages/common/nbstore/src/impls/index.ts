import type { Storage } from '../storage';
import type { broadcastChannelStorages } from './broadcast-channel';
import type { cloudStorages } from './cloud';
import type { idbStorages } from './idb';
import type { idbV1Storages } from './idb/v1';
import type { sqliteStorages } from './sqlite';

export type StorageConstructor = {
  new (...args: any[]): Storage;
  readonly identifier: string;
};

type Storages =
  | typeof cloudStorages
  | typeof idbV1Storages
  | typeof idbStorages
  | typeof sqliteStorages
  | typeof broadcastChannelStorages;

// oxlint-disable-next-line no-redeclare
export type AvailableStorageImplementations = {
  [key in Storages[number]['identifier']]: Storages[number] & {
    identifier: key;
  };
};
