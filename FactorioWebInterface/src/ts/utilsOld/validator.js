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
        return this._error === null || this._error === undefined;
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
            //return ValidationResult.error(`Missing validation rule for ${propertyName}`);
        }
        return ruleInfo.rule(this.obj);
    }
}
//# sourceMappingURL=validator.js.map