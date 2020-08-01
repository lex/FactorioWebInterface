import { ValidationResult } from "./ValidationResult";
import { IValidationRule, NotEmptyString, NoWhitespaceString, NotNull, MaxStringLength, MinMaxStringLength, EqualToOtherString } from "./validationRule";

export interface IValidationGroup<T> {
    key: any;
    validate(obj: T): ValidationResult;
}

export class PropertyValidation<T> implements IValidationGroup<T> {
    private _name: string;
    private _displayName: string;
    private _rules: IValidationRule<T>[] = [];

    get key() {
        return this._name;
    }

    constructor(name: string) {
        if (name == null) {
            throw 'name can not be null or undefined.';
        }

        this._name = name;
        this._displayName = name;
    }

    displayName(displayName: string): this {
        this._displayName = displayName ?? this._name;
        return this;
    }

    rules(...rules: IValidationRule<T>[]): this {
        this._rules.push(...rules);
        return this;
    }

    validate(obj: T): ValidationResult {
        const value = obj[this._name];
        const errors: string[] = [];

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

    notEmptyString(): this {
        this._rules.push(new NotEmptyString());
        return this;
    }

    noWhitespaceString(): this {
        this._rules.push(new NoWhitespaceString());
        return this;
    }

    notNull(): this {
        this._rules.push(new NotNull());
        return this;
    }

    maxStringLength(max: number): this {
        this._rules.push(new MaxStringLength(max));
        return this;
    }

    minMaxStringLength(min: number, max: number): this {
        this._rules.push(new MinMaxStringLength(min, max));
        return this;
    }

    equalToOtherString(otherProperty: string, otherPropertyDisplayName?: string): this {
        this._rules.push(new EqualToOtherString(otherProperty, otherPropertyDisplayName));
        return this;
    }
}
