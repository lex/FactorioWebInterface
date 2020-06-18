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
}