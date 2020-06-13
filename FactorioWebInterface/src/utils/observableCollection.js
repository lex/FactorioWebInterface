import { Observable } from "./observable";
import { CollectionChangeType } from "../ts/utils";
export class ObservableCollection extends Observable {
}
export class ObservableKeyCollection extends ObservableCollection {
}
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
    values() {
        return this._map.values();
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
export class ObservableArray extends ObservableCollection {
    constructor() {
        super(...arguments);
        this._items = [];
    }
    get count() {
        return this._items.length;
    }
    values() {
        return this._items.values();
    }
    bind(callback, subscriptions) {
        let subscription = this.subscribe(callback, subscriptions);
        callback({ Type: CollectionChangeType.Reset });
        return subscription;
    }
    update(changeData) {
        function remove(items, remove) {
            for (let i = 0; i < remove.length; i++) {
                let index = items.indexOf(remove[i]);
                if (index >= 0) {
                    items.splice(index);
                }
            }
        }
        function add(items, add) {
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
//# sourceMappingURL=observableCollection.js.map