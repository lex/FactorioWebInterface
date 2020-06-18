import { Binding } from "./binding";

export class BindingStore {
    private static readonly _global = new WeakMap<object, BindingStore>();

    static get(object: object): BindingStore | undefined {
        return BindingStore._global.get(object);
    }

    static getOrNew(object: object): BindingStore {
        let global = BindingStore._global;

        let store = global.get(object);
        if (store == null) {
            store = new BindingStore();
            global.set(object, store);
        }

        return store;
    }

    private readonly _map = new Map<any, Binding>();

    set(key: any, binding: Binding): void {
        let map = this._map;

        let oldBinding = map.get(key);
        oldBinding?.disconnected();

        if (binding == null) {
            map.delete(key);
        }
        else {
            map.set(key, binding);
        }
    }

    connected(): void {
        for (let binding of this._map.values()) {
            binding.connected();
        }
    }

    disconnected(): void {
        for (let binding of this._map.values()) {
            binding.disconnected();
        }
    }
}
