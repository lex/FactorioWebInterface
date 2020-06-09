import { Observable } from "./observable";
import { CollectionChangedData, CollectionChangeType } from "../ts/utils";

export interface IKeySelector<K, V> {
    keySelector: (value: V) => K;
}

export abstract class ObservableCollection<T> extends Observable<CollectionChangedData<T>> {
    abstract get count(): number;
    abstract values(): IterableIterator<T>;
}

export abstract class ObservableKeyCollection<K, V> extends ObservableCollection<V> implements IKeySelector<K, V>{
    abstract keySelector: (value: V) => K;
}

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

    values(): IterableIterator<V> {
        return this._map.values();
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

export class ObservableArray<T> extends ObservableCollection<T>{
    private _items: Array<T> = [];

    get count(): number {
        return this._items.length;
    }

    values(): IterableIterator<T> {
        return this._items.values();
    }

    update(changeData: CollectionChangedData<T>): void {
        function remove(items: T[], remove: T[]) {
            for (let i = 0; i < remove.length; i++) {
                let index = items.indexOf(remove[i]);
                if (index >= 0) {
                    items.splice(index);
                }
            }
        }

        function add(items: T[], add: T[]) {
            items.push(...add);
        }

        switch (changeData.Type) {
            case CollectionChangeType.Reset:
                this._items.length = 0;
                add(this._items, changeData.NewItems);
                break;
            case CollectionChangeType.Remove:
                remove(this._items, changeData.OldItems);
                break;
            case CollectionChangeType.Add:
                add(this._items, changeData.NewItems);
                break;
            case CollectionChangeType.AddAndRemove:
                remove(this._items, changeData.OldItems);
                add(this._items, changeData.NewItems);
                break;
            default:
                return;
        }

        this.raise(changeData);
    }
}