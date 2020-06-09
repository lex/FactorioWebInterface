export class ViewLocator {
    constructor() {
        this._viewFactories = new Map();
    }
    registerViewModel(vmConstructor, factory) {
        this._viewFactories.set(vmConstructor, factory);
    }
    getFromViewModel(vmConstructor, vm) {
        let map = this._viewFactories;
        let viewFactory = map.get(vmConstructor);
        if (viewFactory == null) {
            return undefined;
        }
        return viewFactory(vm);
    }
}
//# sourceMappingURL=viewLocator.js.map