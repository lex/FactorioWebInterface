import { Observable } from "./observable";
import { ValidationResult } from "./validator";
export class ObservableErrors {
    constructor() {
        this._errorChangedObservable = new Observable();
        this._propertyErrors = new Map();
        this.propertyErrors = this._propertyErrors;
    }
    errorChanged(callback) {
        return this._errorChangedObservable.subscribe(callback);
    }
    setError(propertName, error) {
        let old = this._propertyErrors.get(propertName);
        if (old === error) {
            return;
        }
        this._propertyErrors.set(propertName, error);
        this._errorChangedObservable.raise(this, propertName);
    }
    getError(propertyName) {
        let error = this._propertyErrors.get(propertyName);
        if (error === undefined) {
            return ValidationResult.validResult;
        }
        return error;
    }
    static isType(obj) {
        return obj.errors !== undefined;
    }
}
//# sourceMappingURL=ObservableErrors.js.map