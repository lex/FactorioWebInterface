import { strict } from "assert";
import { CircularBuffer } from "./circularBuffer";

describe('CircularBuffer', function () {
    function toArray<T>(iterator: Iterable<T>): T[] {
        // written this was to test [Symbol.iterator].

        let array = [];
        for (let item of iterator) {
            array.push(item);
        }

        return array;
    }

    it('constructor with capacity', function () {
        const capacity = 4;

        let cb = new CircularBuffer<number>(capacity);

        strict.equal(cb.capacity, capacity);
        strict.equal(cb.count, 0);

        strict.equal(cb.toArray().length, 0);
        strict.equal([...cb.values()].length, 0);
        strict.equal(toArray(cb).length, 0);
    });

    it('constructor without capacity has default capacity', function () {
        let cb = new CircularBuffer<number>();

        strict.equal(cb.capacity, CircularBuffer.defaultCapacity);
    });

    it('constructor with values', function () {
        const capacity = 4;

        let values = [1, 2, 3, 4];

        let cb = new CircularBuffer<number>(capacity, values.values());

        strict.equal(cb.count, values.length);

        strict.deepEqual(cb.toArray(), values);
        strict.deepEqual([...cb.values()], values);
        strict.deepEqual(toArray(cb), values);
    });

    it('constructor with values over capacity', function () {
        const capacity = 2;

        let values = [1, 2, 3, 4];

        let cb = new CircularBuffer<number>(capacity, values.values());

        let expected = [3, 4];

        strict.equal(cb.count, capacity);

        strict.deepEqual(cb.toArray(), expected);
        strict.deepEqual([...cb.values()], expected);
        strict.deepEqual(toArray(cb), expected);
    });

    it('constructor with invalid capacity throws', function () {
        strict.throws(() => new CircularBuffer<number>(-1));
        strict.throws(() => new CircularBuffer<number>(0));
    });

    let addWithinCapacityTests = [
        { name: '0', values: [] },
        { name: '2', values: [1, 2] },
        { name: '4', values: [1, 2, 3, 4] },
    ];

    for (let test of addWithinCapacityTests) {
        it(`add within capacity size ${test.name}`, function () {
            let cb = new CircularBuffer<number>(4);

            for (let item of test.values) {
                let removed = cb.add(item);
                strict.equal(removed, undefined);
            }

            strict.equal(cb.count, test.values.length);

            strict.deepEqual(cb.toArray(), test.values);
            strict.deepEqual([...cb.values()], test.values);
            strict.deepEqual(toArray(cb), test.values);
        });
    }

    let addOverCapacityTests = [
        { name: '5', values: [1, 2, 3, 4, 5], expected: [2, 3, 4, 5], expectedRemoved: [1] },
        { name: '8', values: [1, 2, 3, 4, 5, 6, 7, 8], expected: [5, 6, 7, 8], expectedRemoved: [1, 2, 3, 4] },
        { name: '9', values: [1, 2, 3, 4, 5, 6, 7, 8, 9], expected: [6, 7, 8, 9], expectedRemoved: [1, 2, 3, 4, 5] },
    ];

    for (let test of addOverCapacityTests) {
        it(`add over capacity size ${test.name}`, function () {
            const capacity = 4;

            let actualRemoved = [];

            let cb = new CircularBuffer<number>(capacity);

            for (let item of test.values) {
                let removed = cb.add(item);
                if (removed != null) {
                    actualRemoved.push(removed);
                }
            }

            strict.equal(cb.count, capacity);
            strict.deepEqual(cb.toArray(), test.expected);
            strict.deepEqual([...cb.values()], test.expected);
            strict.deepEqual(toArray(cb), test.expected);
            strict.deepEqual(actualRemoved, test.expectedRemoved);
        });
    }

    it('throws error when capacity <= 0', function () {
        strict.throws(() => new CircularBuffer(0), /capacity must be greater than 0.$/);
        strict.throws(() => new CircularBuffer(-1), /capacity must be greater than 0.$/);
    });
});