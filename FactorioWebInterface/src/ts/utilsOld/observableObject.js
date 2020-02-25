import { Observable } from "./observable";
export class ObservableObject {
    constructor() {
        this._propertyChangeObservable = new Observable();
    }
    propertyChanged(callback) {
        return this._propertyChangeObservable.subscribe(callback);
    }
    raise(propertyName) {
        this._propertyChangeObservable.raise(this, propertyName);
    }
    setAndRaise(fields, propertyName, value) {
        let old = fields[propertyName];
        if (old === value) {
            return false;
        }
        fields[propertyName] = value;
        this.raise(propertyName);
        return true;
    }
}
//# sourceMappingURL=observableObject.js.map