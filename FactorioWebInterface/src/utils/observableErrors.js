import { Observable } from "./observable";
import { IterableHelper } from "./iterableHelper";
import { ValidationResult } from "./validation/module";
export class ObservableErrors {
    constructor() {
        this._errorChangedObservable = new Map();
        this._propertyErrors = new Map();
    }
    get propertyErrors() {
        return this._propertyErrors;
    }
    ;
    get hasErrors() {
        return IterableHelper.any(this._propertyErrors.values(), result => !result.valid);
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