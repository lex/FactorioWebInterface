import { ObservableKeyCollection } from "./observableCollection";
import { CollectionChangedData, CollectionChangeType } from "../../ts/utils";

export class ObservableKeyArray<K, V> extends ObservableKeyCollection<K, V> {
    private _map = new Map<K, V>();
    private _keySelector: (value: V) => K;

    get count(): number {
        return this._map.size;
    }

    get keySelector() {
        return this._keySelector;
    }

    constructor(keySelector: (value: V) => K) {
        super();
        this._keySelector = keySelector;
    }

    [Symbol.iterator](): IterableIterator<V> {
        return this._map.values();
    }

    values(): IterableIterator<V> {
        return this._map.values();
    }

    has(key: K): boolean {
        return this._map.has(key);
    }

    bind(callback: (event: CollectionChangedData<V>) => void, subscriptions?: (() => void)[]): () => void {
        let subscription = this.subscribe(callback, subscriptions);

        callback({ Type: CollectionChangeType.Reset });

        return subscription;
    }

    update(changeData: CollectionChangedData): void {
        switch (changeData.Type) {
            case CollectionChangeType.Reset: {
                this.doReset(changeData.NewItems);
                this.raise({ Type: CollectionChangeType.Reset });
                return;
            }
            case CollectionChangeType.Remove: {
                let removed = this.doRemove(changeData.OldItems);

                if (removed.length === 0) {
                    return;
                }

                this.raise({ Type: CollectionChangeType.Remove, OldItems: removed });
                return;
            }
            case CollectionChangeType.Add: {
                let added = this.doAdd(changeData.NewItems);

                if (added.length === 0) {
                    return;
                }

                this.raise({ Type: CollectionChangeType.Add, NewItems: added });
                return;
            }
            case CollectionChangeType.AddAndRemove: {
                let removed = this.doRemove(changeData.OldItems);
                let added = this.doAdd(changeData.NewItems);

                if (removed.length === 0 && added.length === 0) {
                    return;
                }

                this.raise({ Type: CollectionChangeType.AddAndRemove, NewItems: added, OldItems: removed });
                return;
            }
            default:
                return;
        }
    }

    add(...items: V[]) {
        let added = this.doAdd(items);
        let changeData: CollectionChangedData = {
            Type: CollectionChangeType.Add,
            NewItems: added
        };
        this.raise(changeData);
    }

    remove(...items: V[]) {
        let removed = this.doRemove(items);
        let changeData: CollectionChangedData = {
            Type: CollectionChangeType.Remove,
            OldItems: removed
        };
        this.raise(changeData);
    }

    reset(...items: V[]) {
        this.doReset(items);
        this.raise({ Type: CollectionChangeType.Reset });
    }

    private doReset(items?: V[]): void {
        let map = this._map;
        map.clear();

        if (items == null || items.length === 0) {
            return;
        }

        let keySelector = this._keySelector;

        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            let key = keySelector(item);
            map.set(key, item);
        }
    }

    private doAdd(items?: V[]): V[] {
        if (items == null || items.length === 0) {
            return [];
        }

        let keySelector = this._keySelector;
        let map = this._map;
        let added = new Map<K, V>();

        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            let key = keySelector(item);
            map.set(key, item);
            added.set(key, item);
        }

        return [...added.values()];
    }

    private doRemove(items: V[]): V[] {
        if (items == null || items.length === 0) {
            return [];
        }

        let keySelector = this._keySelector;
        let map = this._map;
        let removed: V[] = [];

        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            let key = keySelector(item);

            if (map.delete(key)) {
                removed.push(item)
            }
        }

        return removed;
    }
}
