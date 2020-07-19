import { ValidationResult } from "./ValidationResult";
export class Validator {
    constructor(obj, rules) {
        this.obj = obj;
        this._ruleMap = new Map();
        for (let i = 0; i < rules.length; i++) {
            let rule = rules[i];
            this._ruleMap.set(rule.key, rule);
        }
    }
    validate(key) {
        let validationGroup = this._ruleMap.get(key);
        if (validationGroup === undefined) {
            return ValidationResult.validResult;
        }
        return validationGroup.validate(this.obj);
    }
}
//# sourceMappingURL=validator.js.map