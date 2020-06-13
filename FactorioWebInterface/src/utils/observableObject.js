import { Observable } from "./observable";
export class ObservableObject {
    constructor() {
        this._propertyChangeObservable = new Map();
    }
    propertyChanged(propertyName, callback, subscriptions) {
        let observables = this._propertyChangeObservable.get(propertyName);
        if (!observables) {
            observables = new Observable();
            this._propertyChangeObservable.set(propertyName, observables);
        }
        return observables.subscribe(callback, subscriptions);
    }
    bind(propertyName, callback, subscriptions) {
        let subscription = this.propertyChanged(propertyName, callback, subscriptions);
        callback(this[propertyName]);
        return subscription;
    }
    raise(propertyName, value) {
        let observables = this._propertyChangeObservable.get(propertyName);
        if (!observables) {
            return;
        }
        observables.raise(value);
    }
    setAndRaise(fields, propertyName, value) {
        let old = fields[propertyName];
        if (old === value) {
            return false;
        }
        fields[propertyName] = value;
        this.raise(propertyName, value);
        return true;
    }
}
//# sourceMappingURL=observableObject.js.map