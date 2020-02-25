import { ValidationResult } from "./validator";
import { Observable } from "./observable";

export interface IObservableErrors {
    errors: ObservableErrors;
}

export class ObservableErrors {
    private _errorChangedObservable = new Map<string, Observable<ValidationResult>>();
    private _propertyErrors = new Map<string, ValidationResult>();

    propertyErrors: ReadonlyMap<string, ValidationResult> = this._propertyErrors;

    errorChanged(propertyName: string, callback: (event: ValidationResult) => void): () => void {
        let observables = this._errorChangedObservable.get(propertyName);
        if (!observables) {
            observables = new Observable();
            this._errorChangedObservable.set(propertyName, observables);
        }

        return observables.subscribe(callback);
    }

    setError(propertyName: string, error: ValidationResult) {
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

    getError(propertyName: string): ValidationResult {
        let error = this._propertyErrors.get(propertyName);

        if (error === undefined) {
            return ValidationResult.validResult;
        }

        return error;
    }

    static isType(obj: object): obj is IObservableErrors {
        return (obj as IObservableErrors).errors instanceof ObservableErrors;
    }
}