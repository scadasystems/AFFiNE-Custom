import type { Memento } from '@toeverything/infra';
import EventEmitter2 from 'eventemitter2';
import { Observable } from 'rxjs';

import type {
  GlobalCache,
  GlobalSessionState,
  GlobalState,
} from '../providers/global';

export class StorageMemento implements Memento {
  // eventEmitter is used for same tab event
  private readonly eventEmitter = new EventEmitter2();
  // channel is used for cross-tab event
  private readonly channel = new BroadcastChannel(this.prefix);
  constructor(
    private readonly storage: Storage,
    private readonly prefix: string
  ) {}

  keys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.slice(this.prefix.length));
      }
    }
    return keys;
  }

  get<T>(key: string): T | undefined {
    const json = this.storage.getItem(this.prefix + key);
    return json ? JSON.parse(json) : undefined;
  }
  watch<T>(key: string): Observable<T | undefined> {
    return new Observable<T | undefined>(subscriber => {
      const json = this.storage.getItem(this.prefix + key);
      const first = json ? JSON.parse(json) : undefined;
      subscriber.next(first);

      const eventEmitterCb = (value: T) => {
        subscriber.next(value);
      };
      this.eventEmitter.on(key, eventEmitterCb);

      const channelCb = (event: MessageEvent) => {
        if (event.data.key === key) {
          subscriber.next(event.data.value);
        }
      };
      this.channel.addEventListener('message', channelCb);
      return () => {
        this.eventEmitter.off(key, eventEmitterCb);
        this.channel.removeEventListener('message', channelCb);
      };
    });
  }
  set<T>(key: string, value: T): void {
    this.storage.setItem(this.prefix + key, JSON.stringify(value));
    this.eventEmitter.emit(key, value);
    this.channel.postMessage({ key, value });
  }

  del(key: string): void {
    this.storage.removeItem(this.prefix + key);
  }

  clear(): void {
    for (const key of this.keys()) {
      this.del(key);
    }
  }
}

export class LocalStorageGlobalCache
  extends StorageMemento
  implements GlobalCache
{
  constructor() {
    super(localStorage, 'global-cache:');
  }
}

export class LocalStorageGlobalState
  extends StorageMemento
  implements GlobalState
{
  constructor() {
    super(localStorage, 'global-state:');
  }
}

export class SessionStorageGlobalSessionState
  extends StorageMemento
  implements GlobalSessionState
{
  constructor() {
    super(sessionStorage, 'global-session-state:');
  }
}
