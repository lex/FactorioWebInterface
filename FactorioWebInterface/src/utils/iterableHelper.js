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
}
//# sourceMappingURL=iterableHelper.js.map