export class IterableHelper {
    static firstOrDefault(iterator, defaultValue) {
        for (let value of iterator) {
            return value;
        }
        return defaultValue;
    }
    static *combine(...iterators) {
        for (let iterator of iterators) {
            for (let value of iterator) {
                yield value;
            }
        }
    }
    static *map(iterator, mapper) {
        for (let value of iterator) {
            yield mapper(value);
        }
    }
    static *where(it, predicate) {
        for (let item of it) {
            if (predicate(item)) {
                yield item;
            }
        }
    }
    static max(iterator, selector) {
        let maxValue = undefined;
        let maxItem = undefined;
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
//# sourceMappingURL=iterableHelper.js.map