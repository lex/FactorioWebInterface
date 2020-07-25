import { ObservableCollection } from "./observableCollection";
import { CollectionChangedData, CollectionChangeType } from "../../ts/utils";

export class ObservableArray<T> extends ObservableCollection<T> {
    private _items: Array<T> = [];

    get count(): number {
        return this._items.length;
    }

    [Symbol.iterator](): IterableIterator<T> {
        return this._items.values();
    }

    values(): IterableIterator<T> {
        return this._items.values();
    }

    bind(callback: (event: CollectionChangedData<T>) => void, subscriptions?: (() => void)[]): () => void {
        let subscription = this.subscribe(callback, subscriptions);

        callback({ Type: CollectionChangeType.Reset });

        return subscription;
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
