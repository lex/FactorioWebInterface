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
            case CollectionChangeType.Reset:
                this._map.clear();
                this.doAdd(changeData.NewItems);
                break;
            case CollectionChangeType.Remove:
                this.doRemove(changeData.OldItems);
                break;
            case CollectionChangeType.Add:
                this.doAdd(changeData.NewItems);
                break;
            case CollectionChangeType.AddAndRemove:
                this.doRemove(changeData.OldItems);
                this.doAdd(changeData.NewItems);
                break;
            default:
                return;
        }

        this.raise(changeData);
    }

    add(...items: V[]) {
        this.doAdd(items);
        let changeData: CollectionChangedData = {
            Type: CollectionChangeType.Add,
            NewItems: items
        };
        this.raise(changeData);
    }

    remove(...items: V[]) {
        this.doRemove(items);
        let changeData: CollectionChangedData = {
            Type: CollectionChangeType.Remove,
            OldItems: items
        };
        this.raise(changeData);
    }

    reset(...items: V[]) {
        this._map.clear();
        this.doAdd(items);

        this.raise({ Type: CollectionChangeType.Reset, NewItems: items });
    }


    private doAdd(items: V[]) {
        if (items == null) {
            return;
        }

        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            let key = this.keySelector(item);
            this._map.set(key, item);
        }
    }


    private doRemove(items: V[]) {
        if (items == null) {
            return;
        }

        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            let key = this.keySelector(item);
            this._map.delete(key);
        }
    }
}
