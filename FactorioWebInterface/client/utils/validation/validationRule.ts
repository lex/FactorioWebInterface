import { ValidationResult } from "./ValidationResult";

export interface IValidationRule<T> {
    validate(value: any, obj?: T): ValidationResult;
}

export class NotEmptyString implements IValidationRule<void>{
    validate(value: string): ValidationResult {
        if (value == null || value === '') {
            return ValidationResult.error('not be empty');
        }

        return ValidationResult.validResult;
    }
}

export class NoWhitespaceString implements IValidationRule<void>{
    validate(value: string): ValidationResult {
        if (/\s/.test(value)) {
            return ValidationResult.error('not contain whitespace characters');
        }

        return ValidationResult.validResult;
    }
}

export class NotNull implements IValidationRule<void>{
    validate(value: any): ValidationResult {
        if (value == null) {
            return ValidationResult.error('not be null');
        }

        return ValidationResult.validResult;
    }
}

export class MaxStringLength implements IValidationRule<void>{
    constructor(public readonly max: number) {
    }

    validate(value: string): ValidationResult {
        if (value?.length > this.max) {
            return ValidationResult.error(`not be longer than ${this.max} characters but is ${value.length}`);
        }

        return ValidationResult.validResult;
    }
}

export class MinMaxStringLength implements IValidationRule<void>{
    constructor(public readonly min: number, public readonly max: number) {
    }

    validate(value: string): ValidationResult {
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

export class EqualToOtherString<T> implements IValidationRule<T>{
    constructor(public readonly otherPropertyName: string, public readonly otherPropertyDisplayName?: string) {
        this.otherPropertyDisplayName = otherPropertyDisplayName ?? otherPropertyName;
    }

    validate(value: string, obj?: T): ValidationResult {
        const other = obj[this.otherPropertyName];

        if (value !== other) {
            return ValidationResult.error(`be equal to ${this.otherPropertyDisplayName}`);
        }

        return ValidationResult.validResult;
    }
}
