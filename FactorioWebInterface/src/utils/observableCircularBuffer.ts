import { ObservableCollection } from "./observableCollection";
import { CircularBuffer } from "./circularBuffer";
import { CollectionChangeType, CollectionChangedData } from "../ts/utils";

export class ObservableCircularBuffer<T> extends ObservableCollection<T> {
    private _buffer: CircularBuffer<T>;

    get count(): number {
        return this._buffer.count;
    }

    constructor(buffer?: CircularBuffer<T>) {
        super();

        this._buffer = buffer ?? new CircularBuffer();
    }

    values(): IterableIterator<T> {
        return this._buffer.values();
    }

    bind(callback: (event: CollectionChangedData<T>) => void, subscriptions?: (() => void)[]): () => void {
        let subscription = this.subscribe(callback, subscriptions);

        callback({ Type: CollectionChangeType.Reset });

        return subscription;
    }

    add(item: T): void {
        let old = this._buffer.add(item);

        if (old != null) {
            this.raise({ Type: CollectionChangeType.AddAndRemove, OldItems: [old], NewItems: [item] });
            return;
        }

        this.raise({ Type: CollectionChangeType.Add, NewItems: [item] });
    }

    reset(items?: T[]): void {
        this._buffer.clear();

        if (items != null) {
            for (let item of items) {
                this._buffer.add(item);
            }
        }

        this.raise({ Type: CollectionChangeType.Reset });
    }

    update(changeData: CollectionChangedData<T>): void {
        switch (changeData.Type) {
            case CollectionChangeType.Reset:
                this.reset();
                return;
            case CollectionChangeType.Add:
                for (let item of changeData.NewItems) {
                    this.add(item);
                }
                return;
            case CollectionChangeType.AddAndRemove:
                for (let item of changeData.NewItems) {
                    this.add(item);
                }
                return;
            case CollectionChangeType.Remove:
            default:
                return;
        }
    }
}