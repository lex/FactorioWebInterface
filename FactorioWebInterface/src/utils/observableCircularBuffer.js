import { ObservableCollection } from "./observableCollection";
import { CircularBuffer } from "./circularBuffer";
import { CollectionChangeType } from "../ts/utils";
export class ObservableCircularBuffer extends ObservableCollection {
    constructor(buffer) {
        super();
        this._buffer = buffer !== null && buffer !== void 0 ? buffer : new CircularBuffer();
    }
    get count() {
        return this._buffer.count;
    }
    values() {
        return this._buffer.values();
    }
    add(item) {
        let old = this._buffer.add(item);
        if (old != null) {
            this.raise({ Type: CollectionChangeType.AddAndRemove, OldItems: [old], NewItems: [item] });
            return;
        }
        this.raise({ Type: CollectionChangeType.Add, NewItems: [item] });
    }
    reset(items) {
        this._buffer.clear();
        if (items != null) {
            for (let item of items) {
                this._buffer.add(item);
            }
        }
        this.raise({ Type: CollectionChangeType.Reset });
    }
    update(changeData) {
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
//# sourceMappingURL=observableCircularBuffer.js.map