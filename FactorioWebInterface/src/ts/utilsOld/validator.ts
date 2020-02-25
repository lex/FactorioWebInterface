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
        return this._error === null || this._error === undefined;
    }

    get error(): string {
        return this._error;
    }
}

export class ValidationRule<T> {
    constructor(public propertyName: string, public rule: (obj: T) => ValidationResult) {

    }
}

export class Validator<T> {
    private ruleMap = new Map<string, ValidationRule<T>>();

    constructor(private obj: T, rules: ValidationRule<T>[]) {
        for (var i = 0; i < rules.length; i++) {
            let rule = rules[i];
            this.ruleMap.set(rule.propertyName, rule);
        }
    }

    validate(propertyName: string): ValidationResult {
        let ruleInfo = this.ruleMap.get(propertyName);

        if (ruleInfo === undefined) {
            return ValidationResult.validResult;
            //return ValidationResult.error(`Missing validation rule for ${propertyName}`);
        }

        return ruleInfo.rule(this.obj);
    }
}

