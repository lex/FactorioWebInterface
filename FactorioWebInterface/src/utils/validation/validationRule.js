import { ValidationResult } from "./ValidationResult";
export class NotEmptyString {
    validate(value) {
        if (value == null || value === '') {
            return ValidationResult.error('not be empty');
        }
        return ValidationResult.validResult;
    }
}
export class NoWhitespaceString {
    validate(value) {
        if (/\s/.test(value)) {
            return ValidationResult.error('not contain whitespace characters');
        }
        return ValidationResult.validResult;
    }
}
export class NotNull {
    validate(value) {
        if (value == null) {
            return ValidationResult.error('not be null');
        }
        return ValidationResult.validResult;
    }
}
export class MaxStringLength {
    constructor(max) {
        this.max = max;
    }
    validate(value) {
        if ((value === null || value === void 0 ? void 0 : value.length) > this.max) {
            return ValidationResult.error(`not be longer than ${this.max} characters but is ${value.length}`);
        }
        return ValidationResult.validResult;
    }
}
export class MinMaxStringLength {
    constructor(min, max) {
        this.min = min;
        this.max = max;
    }
    validate(value) {
        if (value == null) {
            if (this.min <= 0) {
                return ValidationResult.validResult;
            }
            return ValidationResult.error(`be between ${this.min} and ${this.max} characters but is null`);
        }
        if (value.length < this.min || value.length > this.max) {
            return ValidationResult.error(`be between ${this.min} and ${this.max} characters but is ${value.length}`);
        }
        return ValidationResult.validResult;
    }
}
export class EqualToOtherString {
    constructor(otherPropertyName, otherPropertyDisplayName) {
        this.otherPropertyName = otherPropertyName;
        this.otherPropertyDisplayName = otherPropertyDisplayName;
        this.otherPropertyDisplayName = otherPropertyDisplayName !== null && otherPropertyDisplayName !== void 0 ? otherPropertyDisplayName : otherPropertyName;
    }
    validate(value, obj) {
        const other = obj[this.otherPropertyName];
        if (value !== other) {
            return ValidationResult.error(`be equal to ${this.otherPropertyDisplayName}`);
        }
        return ValidationResult.validResult;
    }
}
//# sourceMappingURL=validationRule.js.map