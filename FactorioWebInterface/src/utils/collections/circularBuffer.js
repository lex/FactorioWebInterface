import { ArrayHelper } from "../arrayHelper";
export class CircularBuffer {
    constructor(capacity, values) {
        this._head = 0;
        this._full = false;
        capacity = capacity !== null && capacity !== void 0 ? capacity : CircularBuffer.defaultCapacity;
        if (capacity <= 0) {
            throw 'capacity must be greater than 0.';
        }
        this._capacity = capacity;
        this._array = new Array(capacity);
        if (values != null) {
            for (let value of values) {
                this.add(value);
            }
        }
    }
    get capacity() {
        return this._capacity;
    }
    get count() {
        return this._full ? this._capacity : this._head;
    }
    // Returns the item that was removed, or undefined if not full.
    add(value) {
        let old = this._array[this._head];
        this._array[this._head] = value;
        this._head++;
        if (this._head == this._capacity) {
            this._head = 0;
            this._full = true;
        }
        return old;
    }
    clear() {
        this._array.length = 0;
        this._array.length = this._capacity;
        this._head = 0;
        this._full = false;
    }
    toArray() {
        let array = this._array;
        let head = this._head;
        let capacity = this._capacity;
        if (this._full) {
            let copy = new Array(capacity);
            let offset = capacity - head;
            ArrayHelper.copy(array, head, copy, 0, offset);
            ArrayHelper.copy(array, 0, copy, offset, head);
            return copy;
        }
        else {
            let copy = new Array(head);
            ArrayHelper.copy(array, 0, copy, 0, head);
            return copy;
        }
    }
    [Symbol.iterator]() {
        return this.values();
    }
    *values() {
        let array = this._array;
        let head = this._head;
        if (this._full) {
            for (let i = head; i < array.length; i++) {
                yield array[i];
            }
        }
        for (let i = 0; i < head; i++) {
            yield array[i];
        }
    }
}
CircularBuffer.defaultCapacity = 4;
//# sourceMappingURL=circularBuffer.js.map