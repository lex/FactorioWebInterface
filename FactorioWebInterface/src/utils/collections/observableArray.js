import { ObservableCollection } from "./observableCollection";
import { CollectionChangeType } from "../../ts/utils";
export class ObservableArray extends ObservableCollection {
    constructor() {
        super(...arguments);
        this._items = [];
    }
    get count() {
        return this._items.length;
    }
    [Symbol.iterator]() {
        return this._items.values();
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
//# sourceMappingURL=observableArray.js.map