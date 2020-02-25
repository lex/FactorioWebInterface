export class ServiceLocator {
    constructor() {
        this._serviceFactories = new Map();
        this._services = new Map();
    }
    register(serviceKey, factory) {
        this._serviceFactories.set(serviceKey, factory);
    }
    get(serviceKey) {
        let map = this._services;
        let service = map.get(serviceKey);
        if (service == null) {
            let factory = this._serviceFactories.get(serviceKey);
            service = factory(this);
            map.set(serviceKey, service);
        }
        return service;
    }
}
//# sourceMappingURL=serviceLocator.js.map