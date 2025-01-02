import type { Snapshot, User, Workspace } from '@prisma/client';

import { Flatten, Payload } from './types';

export interface WorkspaceEvents {
  members: {
    reviewRequested: Payload<{ inviteId: string }>;
    requestDeclined: Payload<{
      userId: User['id'];
      workspaceId: Workspace['id'];
    }>;
    requestApproved: Payload<{ inviteId: string }>;
    roleChanged: Payload<{
      userId: User['id'];
      workspaceId: Workspace['id'];
      permission: number;
    }>;
    ownerTransferred: Payload<{ email: string; workspaceId: Workspace['id'] }>;
    updated: Payload<{ workspaceId: Workspace['id']; count: number }>;
    removed: Payload<{ workspaceId: Workspace['id']; userId: User['id'] }>;
  };
  deleted: Payload<Workspace['id']>;
  blob: {
    deleted: Payload<{
      workspaceId: Workspace['id'];
      key: string;
    }>;
    sync: Payload<{
      workspaceId: Workspace['id'];
      key: string;
    }>;
  };
}

export interface DocEvents {
  deleted: Payload<Pick<Snapshot, 'id' | 'workspaceId'>>;
  updated: Payload<Pick<Snapshot, 'id' | 'workspaceId'>>;
}

export interface UserEvents {
  updated: Payload<Omit<User, 'password'>>;
  deleted: Payload<
    User & {
      ownedWorkspaces: Workspace['id'][];
    }
  >;
}

/**
 * Event definitions can be extended by
 *
 * @example
 *
 * declare module './event/def' {
 *   interface UserEvents {
 *     created: Payload<User>;
 *   }
 * }
 *
 * assert<Event, 'user.created'>()
 */
export interface EventDefinitions {
  workspace: WorkspaceEvents;
  snapshot: DocEvents;
  user: UserEvents;
}

export type EventKV = Flatten<EventDefinitions>;

export type Event = keyof EventKV;
export type EventPayload<E extends Event> = EventKV[E];
export type { Payload };
