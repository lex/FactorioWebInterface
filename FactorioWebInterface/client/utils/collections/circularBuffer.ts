import { ArrayHelper } from "../arrayHelper";

export class CircularBuffer<T> implements Iterable<T>{
    static readonly defaultCapacity = 4;

    private _head = 0;
    private _full = false;
    private _array: T[];
    private _capacity: number;

    get capacity(): number {
        return this._capacity;
    }

    get count(): number {
        return this._full ? this._capacity : this._head;
    }

    constructor(capacity?: number, values?: IterableIterator<T>) {
        capacity = capacity ?? CircularBuffer.defaultCapacity;

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

    // Returns the item that was removed, or undefined if not full.
    add(value: T): T | undefined {
        let old = this._array[this._head];

        this._array[this._head] = value;

        this._head++;
        if (this._head == this._capacity) {
            this._head = 0;
            this._full = true;
        }

        return old;
    }

    clear(): void {
        this._array.length = 0;
        this._array.length = this._capacity;

        this._head = 0;
        this._full = false;
    }

    toArray(): T[] {
        let array = this._array;
        let head = this._head;
        let capacity = this._capacity;

        if (this._full) {
            let copy = new Array(capacity);
            let offset = capacity - head;

            ArrayHelper.copy(array, head, copy, 0, offset);
            ArrayHelper.copy(array, 0, copy, offset, head);

            return copy;
        } else {
            let copy = new Array(head);
            ArrayHelper.copy(array, 0, copy, 0, head);
            return copy;
        }
    }

    [Symbol.iterator](): IterableIterator<T> {
        return this.values();
    }

    *values(): IterableIterator<T> {
        let array = this._array;
        let head = this._head

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