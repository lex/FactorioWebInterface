import { ValidationResult } from "./validationResult";
import { IValidationGroup } from "./validationGroup";

export class Validator<T> {
    private _ruleMap = new Map<any, IValidationGroup<T>>();

    constructor(private obj: T, rules: IValidationGroup<T>[]) {
        for (let i = 0; i < rules.length; i++) {
            let rule = rules[i];
            this._ruleMap.set(rule.key, rule);
        }
    }

    validate(key: any): ValidationResult {
        let validationGroup = this._ruleMap.get(key);

        if (validationGroup === undefined) {
            return ValidationResult.validResult;
        }

        return validationGroup.validate(this.obj);
    }
}

