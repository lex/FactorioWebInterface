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
export class ValidationRule {
    constructor(propertyName, rule) {
        this.propertyName = propertyName;
        this.rule = rule;
    }
}
export class NotEmptyString extends ValidationRule {
    constructor(propertyName, propertyNameDescription) {
        super(propertyName, (obj) => {
            let prop = obj[propertyName];
            if (prop == null || prop === '') {
                return ValidationResult.error(`${propertyNameDescription == null ? propertyName : propertyNameDescription} must not be empty.`);
            }
            return ValidationResult.validResult;
        });
    }
}
export class NotNull extends ValidationRule {
    constructor(propertyName, propertyNameDescription) {
        super(propertyName, (obj) => {
            let prop = obj[propertyName];
            if (prop == null) {
                return ValidationResult.error(`${propertyNameDescription == null ? propertyName : propertyNameDescription} must not be null.`);
            }
            return ValidationResult.validResult;
        });
    }
}
export class MaxStringLength extends ValidationRule {
    constructor(propertyName, max, propertyNameDescription) {
        super(propertyName, (obj) => {
            let prop = obj[propertyName];
            if ((prop === null || prop === void 0 ? void 0 : prop.length) > max) {
                return ValidationResult.error(`${propertyNameDescription == null ? propertyName : propertyNameDescription} must not be longer than ${max} characters but is ${prop.length}.`);
            }
            return ValidationResult.validResult;
        });
    }
}
export class MinMaxStringLength extends ValidationRule {
    constructor(propertyName, min, max, propertyNameDescription) {
        super(propertyName, (obj) => {
            let prop = obj[propertyName];
            if ((prop === null || prop === void 0 ? void 0 : prop.length) < min || (prop === null || prop === void 0 ? void 0 : prop.length) > max) {
                return ValidationResult.error(`${propertyNameDescription == null ? propertyName : propertyNameDescription} must be between ${min} and ${max} characters but is ${prop.length}.`);
            }
            return ValidationResult.validResult;
        });
    }
}
export class EqualToOtherString extends ValidationRule {
    constructor(propertyName, otherPropertyName, propertyNameDescription, otherPropertyNameDescription) {
        super(propertyName, (obj) => {
            let prop = obj[propertyName];
            let other = obj[otherPropertyName];
            if (prop !== other) {
                return ValidationResult.error(`${propertyNameDescription == null ? propertyName : propertyNameDescription} and ${otherPropertyNameDescription == null ? otherPropertyName : otherPropertyNameDescription} must be the same.`);
            }
            return ValidationResult.validResult;
        });
    }
}
export class Validator {
    constructor(obj, rules) {
        this.obj = obj;
        this.ruleMap = new Map();
        for (var i = 0; i < rules.length; i++) {
            let rule = rules[i];
            this.ruleMap.set(rule.propertyName, rule);
        }
    }
    validate(propertyName) {
        let ruleInfo = this.ruleMap.get(propertyName);
        if (ruleInfo === undefined) {
            return ValidationResult.validResult;
        }
        return ruleInfo.rule(this.obj);
    }
}
//# sourceMappingURL=validator.js.map