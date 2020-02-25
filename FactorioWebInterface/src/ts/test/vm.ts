import { ObservableErrors, IObservableErrors } from "../../utils/observableErrors";
import { Validator, ValidationResult, ValidationRule } from "../../utils/validator";
import { ObservableObject } from "../../utils/observableObject";

export class ViewModel extends ObservableObject implements IObservableErrors {
    private _fields = {
        name: null as string,
        age: null as number,
        prop1: null as string,
        prop2: null as string,
        prop2Enabled: null as boolean,
        message: null as string
    };

    private _validator: Validator<ViewModel>;

    errors = new ObservableErrors();

    get name() {
        return this._fields.name;
    }
    set name(value: string) {
        this.set('name', value);
    }

    get age() {
        return this._fields.age;
    }
    set age(value: number) {
        this.set('age', value);
    }

    get prop1() {
        return this._fields.prop1;
    }
    set prop1(value: string) {
        if (this.set('prop1', value)) {
            this.prop2 = this.prop1;
        }
    }

    get prop2() {
        return this._fields.prop2;
    }
    set prop2(value: string) {
        if (this.set('prop2', value)) {
            this.prop1 = this.prop2;
        }
    }

    get prop2Enabled() {
        return this._fields.prop2Enabled;
    }
    set prop2Enabled(value: boolean) {
        this.set('prop2Enabled', value);
    }

    get message() {
        return this._fields.message;
    }
    set message(value: string) {
        this.set('message', value);
    }

    constructor() {
        super();

        this._validator = new Validator(this, [
            new ValidationRule('age', this.ageRule)
        ]);
    }

    set(propertyName: string, value: any) {
        if (this.setAndRaise(this._fields, propertyName, value)) {
            let validationResult = this._validator.validate(propertyName);
            this.errors.setError(propertyName, validationResult);
            return true;
        }

        return false;
    }

    private ageRule(vm: ViewModel): ValidationResult {
        let age = vm.age;
        if (age < 10) {
            return ValidationResult.error(`Age ${age} must be greater than 9.`);
        } else if (age > 20) {
            return ValidationResult.error(`Age ${age} must be less than 21.`);
        }

        return ValidationResult.validResult;
    }
}

