import { ObservableKeyCollection } from "./observableCollection";
import { CollectionChangeType } from "../../ts/utils";
export class ObservableKeyArray extends ObservableKeyCollection {
    constructor(keySelector) {
        super();
        this._map = new Map();
        this._keySelector = keySelector;
    }
    get count() {
        return this._map.size;
    }
    get keySelector() {
        return this._keySelector;
    }
    [Symbol.iterator]() {
        return this._map.values();
    }
    values() {
        return this._map.values();
    }
    has(key) {
        return this._map.has(key);
    }
    bind(callback, subscriptions) {
        let subscription = this.subscribe(callback, subscriptions);
        callback({ Type: CollectionChangeType.Reset });
        return subscription;
    }
    update(changeData) {
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
    add(...items) {
        this.doAdd(items);
        let changeData = {
            Type: CollectionChangeType.Add,
            NewItems: items
        };
        this.raise(changeData);
    }
    remove(...items) {
        this.doRemove(items);
        let changeData = {
            Type: CollectionChangeType.Remove,
            OldItems: items
        };
        this.raise(changeData);
    }
    reset(...items) {
        this._map.clear();
        this.doAdd(items);
        this.raise({ Type: CollectionChangeType.Reset, NewItems: items });
    }
    doAdd(items) {
        if (items == null) {
            return;
        }
        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            let key = this.keySelector(item);
            this._map.set(key, item);
        }
    }
    doRemove(items) {
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
//# sourceMappingURL=observableKeyArray.js.map