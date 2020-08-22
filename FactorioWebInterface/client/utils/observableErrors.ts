import { Observable } from "./observable";
import { IterableHelper } from "./iterableHelper";
import { ValidationResult } from "./validation/module";

export interface IObservableErrors {
    errors: ObservableErrors;
}

export class ObservableErrors {
    private _errorChangedObservable = new Map<string, Observable<ValidationResult>>();
    private _propertyErrors = new Map<string, ValidationResult>();

    get propertyErrors(): ReadonlyMap<string, ValidationResult> {
        return this._propertyErrors;
    };

    get hasErrors(): boolean {
        return IterableHelper.any(this._propertyErrors.values(), result => !result.valid);
    }

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