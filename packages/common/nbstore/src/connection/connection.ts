import EventEmitter2 from 'eventemitter2';
import { throttle } from 'lodash-es';

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'closed';

export interface Connection<T = any> {
  readonly status: ConnectionStatus;
  readonly inner: T;
  connect(): void;
  disconnect(): void;
  waitForConnected(signal?: AbortSignal): Promise<void>;
  onStatusChanged(
    cb: (status: ConnectionStatus, error?: Error) => void
  ): () => void;
}

export abstract class AutoReconnectConnection<T = any>
  implements Connection<T>
{
  private readonly event = new EventEmitter2();
  private _inner: T | null = null;
  private _unsubscribeError: (() => void) | null = null;
  private _status: ConnectionStatus = 'idle';
  protected error?: Error;
  private refCount = 0;
  private connectingAbort?: AbortController;

  constructor() {
    this.autoReconnect();
  }

  get shareId(): string | undefined {
    return undefined;
  }

  get maybeConnection() {
    return this._inner;
  }

  get inner(): T {
    if (!this._inner) {
      throw new Error(
        `Connection ${this.constructor.name} has not been established.`
      );
    }

    return this._inner;
  }

  private set inner(inner: T | null) {
    this._inner = inner;
  }

  get status() {
    return this._status;
  }

  private setStatus(status: ConnectionStatus, error?: Error) {
    const shouldEmit = status !== this._status || error !== this.error;
    this._status = status;
    this.error = error;
    if (shouldEmit) {
      this.emitStatusChanged(status, error);
    }
  }

  protected abstract doConnect(signal?: AbortSignal): Promise<T>;
  protected abstract doDisconnect(conn: T): void;
  protected abstract subscribeError(
    conn: T,
    cb: (reason?: Error) => void
  ): void;

  private innerConnect() {
    if (this.status === 'idle' || this.status === 'error') {
      this.setStatus('connecting');
      this.connectingAbort = new AbortController();
      this.doConnect(this.connectingAbort.signal)
        .then(value => {
          if (!this.connectingAbort?.signal.aborted) {
            this.setStatus('connected');
            this._inner = value;
            this.subscribeError(this._inner, reason =>
              this.handleError(reason)
            );
          } else {
            try {
              this.doDisconnect(value);
            } catch (error) {
              console.error('failed to disconnect', error);
            }
          }
        })
        .catch(error => {
          if (!this.connectingAbort?.signal.aborted) {
            console.error('failed to connect', error);
            this.setStatus('error', error as any);
          }
        });
    }
  }

  private handleError(reason?: Error) {
    // on error
    console.error('connection error, will reconnect', reason);
    try {
      if (this._inner) {
        this.doDisconnect(this._inner);
      }
    } catch (error) {
      console.error('failed to disconnect', error);
    }
    this._inner = null;
    this.setStatus('error', reason);
    // reconnect
    this.innerConnect();
  }

  connect() {
    this.refCount++;
    if (this.refCount === 1) {
      this.innerConnect();
    }
  }

  disconnect() {
    this.refCount--;
    if (this.refCount === 0) {
      this.connectingAbort?.abort();
      this._unsubscribeError();
      try {
        if (this._inner) {
          this.doDisconnect(this._inner);
        }
      } catch (error) {
        console.error('failed to disconnect', error);
      }
      this._unsubscribeError = null;
      this._inner = null;
      this.setStatus('closed');
    }
  }

  private autoReconnect() {
    // TODO:
    //   - maximum retry count
    //   - dynamic sleep time (attempt < 3 ? 1s : 1min)?
    this.onStatusChanged(
      throttle(() => {
        () => {
          if (this._enableAutoReconnect) {
            this.innerConnect();
          }
        };
      }, 1000)
    );
  }

  waitForConnected(signal?: AbortSignal) {
    return new Promise<void>((resolve, reject) => {
      if (this.status === 'connected') {
        resolve();
        return;
      }

      this.onStatusChanged(status => {
        if (status === 'connected') {
          resolve();
        }
      });

      signal?.addEventListener('abort', reason => {
        reject(reason);
      });
    });
  }

  onStatusChanged(
    cb: (status: ConnectionStatus, error?: Error) => void
  ): () => void {
    this.event.on('statusChanged', cb);
    return () => {
      this.event.off('statusChanged', cb);
    };
  }

  private readonly emitStatusChanged = (
    status: ConnectionStatus,
    error?: Error
  ) => {
    this.event.emit('statusChanged', status, error);
  };
}

export class DummyConnection implements Connection<undefined> {
  readonly status: ConnectionStatus = 'connected';
  readonly inner: undefined;

  connect(): void {
    return;
  }
  disconnect(): void {
    return;
  }
  waitForConnected(_signal?: AbortSignal): Promise<void> {
    return Promise.resolve();
  }
  onStatusChanged(
    _cb: (status: ConnectionStatus, error?: Error) => void
  ): () => void {
    return () => {};
  }
}
