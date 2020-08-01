export class ValidationResult {
    private static _validResult: ValidationResult = new ValidationResult(null);
    static get validResult(): ValidationResult {
        return ValidationResult._validResult;
    }


    private constructor(private _error: string) { }


    static error(_error: string): ValidationResult {
        return new ValidationResult(_error);
    }

    get valid(): boolean {
        return this._error == null;
    }

    get error(): string {
        return this._error;
    }
}
