import { ValidationResult } from "./validator";
import { Observable } from "./observable";
export class ObservableErrors {
    constructor() {
        this._errorChangedObservable = new Map();
        this._propertyErrors = new Map();
        this.propertyErrors = this._propertyErrors;
    }
    errorChanged(propertyName, callback) {
        let observables = this._errorChangedObservable.get(propertyName);
        if (!observables) {
            observables = new Observable();
            this._errorChangedObservable.set(propertyName, observables);
        }
        return observables.subscribe(callback);
    }
    setError(propertyName, error) {
        let old = this._propertyErrors.get(propertyName);
        if (old === error) {
            return;
        }
        this._propertyErrors.set(propertyName, error);
        let observables = this._errorChangedObservable.get(propertyName);
        if (!observables) {
            return;
        }
        observables.raise(error);
    }
    getError(propertyName) {
        let error = this._propertyErrors.get(propertyName);
        if (error === undefined) {
            return ValidationResult.validResult;
        }
        return error;
    }
    static isType(obj) {
        return obj.errors instanceof ObservableErrors;
    }
}
//# sourceMappingURL=observableErrors.js.map