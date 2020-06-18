export class BindingStore {
    constructor() {
        this._map = new Map();
    }
    static get(object) {
        return BindingStore._global.get(object);
    }
    static getOrNew(object) {
        let global = BindingStore._global;
        let store = global.get(object);
        if (store == null) {
            store = new BindingStore();
            global.set(object, store);
        }
        return store;
    }
    set(key, binding) {
        let map = this._map;
        let oldBinding = map.get(key);
        oldBinding === null || oldBinding === void 0 ? void 0 : oldBinding.disconnected();
        if (binding == null) {
            map.delete(key);
        }
        else {
            map.set(key, binding);
        }
    }
    connected() {
        for (let binding of this._map.values()) {
            binding.connected();
        }
    }
    disconnected() {
        for (let binding of this._map.values()) {
            binding.disconnected();
        }
    }
}
BindingStore._global = new WeakMap();
//# sourceMappingURL=BindingStore.js.map