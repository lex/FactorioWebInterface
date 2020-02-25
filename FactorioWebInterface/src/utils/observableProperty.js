import { Observable } from "./observable";
export class ObservableProperty extends Observable {
    constructor(value) {
        super();
        this._value = value;
    }
    get value() {
        return this._value;
    }
    raise(event) {
        this._value = event;
        super.raise(event);
    }
}
//# sourceMappingURL=observableProperty.js.map