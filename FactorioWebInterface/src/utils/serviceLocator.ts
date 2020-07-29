export class ServiceLocator {
    private _serviceFactories = new Map<any, (services: ServiceLocator) => any>();
    private _services = new Map<any, any>();

    register<T>(serviceKey: any, factory: (services?: ServiceLocator) => T) {
        this._serviceFactories.set(serviceKey, factory);
    }

    get<T>(serviceKey: any): T {
        let map = this._services;
        let service = map.get(serviceKey);

        if (service == null) {
            let factory = this._serviceFactories.get(serviceKey);
            if (factory == null) {
                throw `Service ${serviceKey} has not been registered.`;
            }

            service = factory(this);
            map.set(serviceKey, service);
        }

        return service;
    }
}