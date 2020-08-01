export class ViewLocator {
    private _viewFactories = new Map<any, (vm: any) => any>();

    registerViewModel(vmConstructor: Function, factory: (vm: object) => any) {
        this._viewFactories.set(vmConstructor, factory);
    }

    getFromViewModel<T>(vmConstructor: Function, vm: object): T {
        let map = this._viewFactories;
        let viewFactory = map.get(vmConstructor);

        if (viewFactory == null) {
            return undefined;
        }

        return viewFactory(vm)
    }
}