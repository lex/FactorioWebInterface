import { Observable } from "./observable";
export class ObservableProperty extends Observable {
    constructor(value) {
        super();
        this._value = value;
    }
    get value() {
        return this._value;
    }
    bind(callback, subscriptions) {
        let subscription = this.subscribe(callback, subscriptions);
        callback(this._value);
        return subscription;
    }
    raise(event) {
        this._value = event;
        super.raise(event);
    }
}
//# sourceMappingURL=observableProperty.js.map