export class GlobalStore {
    private static readonly _elements = new Map<any, WeakMap<any, any>>();

    static set<T>(key: any, element: any, value: T): void {
        let elements = GlobalStore._elements;
        let values = elements.get(key);

        if (value === undefined) {
            if (values == null) {
                return;
            }

            values.delete(value);
        }

        if (values == null) {
            values = new WeakMap<any, any>();
            elements.set(key, values);
        }

        values.set(element, value);
    }

    static get<T>(key: any, element: any): T {
        let elements = GlobalStore._elements;
        let values = elements.get(key);

        if (values == null) {
            return undefined;
        }

        return values.get(element);
    }
}