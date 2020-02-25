import { Observable } from "./observable";
import { ValidationResult } from "./validator";

export interface IObservableErrors {
    errors: ObservableErrors;
}

export class ObservableErrors {
    private _errorChangedObservable = new Observable<ObservableErrors, string>();
    private _propertyErrors = new Map<string, ValidationResult>();

    propertyErrors: ReadonlyMap<string, ValidationResult> = this._propertyErrors;

    errorChanged(callback: (sender: ObservableErrors, event: string) => void): () => void {
        return this._errorChangedObservable.subscribe(callback);
    }

    setError(propertName: string, error: ValidationResult) {
        let old = this._propertyErrors.get(propertName);

        if (old === error) {
            return;
        }

        this._propertyErrors.set(propertName, error);
        this._errorChangedObservable.raise(this, propertName);
    }

    getError(propertyName: string): ValidationResult {
        let error = this._propertyErrors.get(propertyName);

        if (error === undefined) {
            return ValidationResult.validResult;
        }

        return error;
    }

    static isType(obj: object): obj is IObservableErrors {
        return (obj as IObservableErrors).errors !== undefined;
    }
}

