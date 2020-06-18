export class GlobalStore {
    static set(key, element, value) {
        let elements = GlobalStore._elements;
        let values = elements.get(key);
        if (value === undefined) {
            if (values == null) {
                return;
            }
            values.delete(value);
        }
        if (values == null) {
            values = new WeakMap();
            elements.set(key, values);
        }
        values.set(element, value);
    }
    static get(key, element) {
        let elements = GlobalStore._elements;
        let values = elements.get(key);
        if (values == null) {
            return undefined;
        }
        return values.get(element);
    }
}
GlobalStore._elements = new Map();
//# sourceMappingURL=globalStore.js.map