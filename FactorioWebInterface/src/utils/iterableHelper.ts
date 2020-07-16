import { trueFunction } from "./functions";

export class IterableHelper {
    static firstOrDefault<T>(iterator: IterableIterator<T>, defaultValue?: T): T {
        for (let value of iterator) {
            return value;
        }

        return defaultValue;
    }

    static *combine<T>(...iterators: IterableIterator<T>[]): IterableIterator<T> {
        for (let iterator of iterators) {
            for (let value of iterator) {
                yield value;
            }
        }
    }

    static *map<T, U>(iterator: IterableIterator<T>, mapper: (item: T) => U): IterableIterator<U> {
        for (let value of iterator) {
            yield mapper(value);
        }
    }

    static *where<T>(it: IterableIterator<T>, predicate: (item: T) => boolean): IterableIterator<T> {
        for (let item of it) {
            if (predicate(item)) {
                yield item;
            }
        }
    }

    static max<T, U>(iterator: IterableIterator<T>, selector: (item: T) => U): T {
        let maxValue: U = undefined;
        let maxItem: T = undefined;
        for (let item of iterator) {
            let value = selector(item);
            if (maxValue === undefined || value > maxValue) {
                maxValue = value;
                maxItem = item;
            }
        }

        return maxItem;
    }

    static any<T>(iterator: IterableIterator<T>, predicate?: (item: T) => boolean) {
        predicate = predicate ?? trueFunction;

        for (let item of iterator) {
            if (predicate(item)) {
                return true;
            }
        }

        return false;
    }
}