export class ValidationResult {
    constructor(_error) {
        this._error = _error;
    }
    static get validResult() {
        return ValidationResult._validResult;
    }
    static error(_error) {
        return new ValidationResult(_error);
    }
    get valid() {
        return this._error == null;
    }
    get error() {
        return this._error;
    }
}
ValidationResult._validResult = new ValidationResult(null);
//# sourceMappingURL=ValidationResult.js.map