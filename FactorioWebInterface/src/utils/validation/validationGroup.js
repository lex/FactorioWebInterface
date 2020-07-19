import { ValidationResult } from "./ValidationResult";
import { NotEmptyString, NoWhitespaceString, NotNull, MaxStringLength, MinMaxStringLength, EqualToOtherString } from "./validationRule";
export class PropertyValidation {
    constructor(name) {
        this._rules = [];
        if (name == null) {
            throw 'name can not be null or undefined.';
        }
        this._name = name;
        this._displayName = name;
    }
    get key() {
        return this._name;
    }
    displayName(displayName) {
        this._displayName = displayName !== null && displayName !== void 0 ? displayName : this._name;
        return this;
    }
    rules(...rules) {
        this._rules.push(...rules);
        return this;
    }
    validate(obj) {
        const value = obj[this._name];
        const errors = [];
        for (const rule of this._rules) {
            const result = rule.validate(value, obj);
            if (!result.valid) {
                errors.push(result.error);
            }
        }
        if (errors.length === 0) {
            return ValidationResult.validResult;
        }
        const errorMessage = `${this._displayName} must ${errors.join(' and ')}.`;
        return ValidationResult.error(errorMessage);
    }
    notEmptyString() {
        this._rules.push(new NotEmptyString());
        return this;
    }
    noWhitespaceString() {
        this._rules.push(new NoWhitespaceString());
        return this;
    }
    notNull() {
        this._rules.push(new NotNull());
        return this;
    }
    maxStringLength(max) {
        this._rules.push(new MaxStringLength(max));
        return this;
    }
    minMaxStringLength(min, max) {
        this._rules.push(new MinMaxStringLength(min, max));
        return this;
    }
    equalToOtherString(otherProperty, otherPropertyDisplayName) {
        this._rules.push(new EqualToOtherString(otherProperty, otherPropertyDisplayName));
        return this;
    }
}
//# sourceMappingURL=validationGroup.js.map