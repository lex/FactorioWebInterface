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
        return this._error == null
    }

    get error(): string {
        return this._error;
    }
}

export class ValidationRule<T> {
    constructor(public propertyName: string, public rule: (obj: T) => ValidationResult) {

    }
}

export class AllValidationRule<T> extends ValidationRule<T> {
    constructor(public propertyName: string, ...validators: ValidationRule<T>[]) {
        super(propertyName, (obj: T): ValidationResult => {
            let errors = [];

            for (const validator of validators) {
                const result = validator.rule(obj);
                if (!result.valid) {
                    errors.push(result.error);
                }
            }

            if (errors.length === 0) {
                return ValidationResult.validResult;
            }

            return ValidationResult.error(errors.join('\n'));
        });
    }
}

export class NotEmptyString<T> extends ValidationRule<T>{
    constructor(propertyName: string, propertyNameDescription?: string) {
        super(propertyName, (obj: T): ValidationResult => {
            let prop = obj[propertyName] as string;

            if (prop == null || prop === '') {
                return ValidationResult.error(`${propertyNameDescription == null ? propertyName : propertyNameDescription} must not be empty.`);
            }

            return ValidationResult.validResult;
        });
    }
}

export class NoWhitespaceString<T> extends ValidationRule<T>{
    constructor(propertyName: string, propertyNameDescription?: string) {
        super(propertyName, (obj: T): ValidationResult => {
            let prop = obj[propertyName] as string;

            if (/\s/.test(prop)) {
                return ValidationResult.error(`${propertyNameDescription == null ? propertyName : propertyNameDescription} must not contain whitespace characters.`);
            }

            return ValidationResult.validResult;
        });
    }
}

export class NotNull<T> extends ValidationRule<T>{
    constructor(propertyName: string, propertyNameDescription?: string) {
        super(propertyName, (obj: T): ValidationResult => {
            let prop = obj[propertyName];

            if (prop == null) {
                return ValidationResult.error(`${propertyNameDescription == null ? propertyName : propertyNameDescription} must not be null.`);
            }

            return ValidationResult.validResult;
        });
    }
}

export class MaxStringLength<T> extends ValidationRule<T>{
    constructor(propertyName: string, max: number, propertyNameDescription?: string) {
        super(propertyName, (obj: T): ValidationResult => {
            let prop = obj[propertyName] as string;

            if (prop?.length > max) {
                return ValidationResult.error(`${propertyNameDescription == null ? propertyName : propertyNameDescription} must not be longer than ${max} characters but is ${prop.length}.`);
            }

            return ValidationResult.validResult;
        });
    }
}

export class MinMaxStringLength<T> extends ValidationRule<T>{
    constructor(propertyName: string, min: number, max: number, propertyNameDescription?: string) {
        super(propertyName, (obj: T): ValidationResult => {
            let prop = obj[propertyName] as string;

            if (prop?.length < min || prop?.length > max) {
                return ValidationResult.error(`${propertyNameDescription == null ? propertyName : propertyNameDescription} must be between ${min} and ${max} characters but is ${prop.length}.`);
            }

            return ValidationResult.validResult;
        });
    }
}

export class EqualToOtherString<T> extends ValidationRule<T>{
    constructor(propertyName: string, otherPropertyName: string, propertyNameDescription?: string, otherPropertyNameDescription?: string) {
        super(propertyName, (obj: T): ValidationResult => {
            let prop = obj[propertyName] as string;
            let other = obj[otherPropertyName] as string;

            if (prop !== other) {
                return ValidationResult.error(`${propertyNameDescription == null ? propertyName : propertyNameDescription} and ${otherPropertyNameDescription == null ? otherPropertyName : otherPropertyNameDescription} must be the same.`);
            }

            return ValidationResult.validResult;
        });
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
        }

        return ruleInfo.rule(this.obj);
    }
}

