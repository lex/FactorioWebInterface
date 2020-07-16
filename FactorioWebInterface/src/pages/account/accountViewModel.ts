import { ObservableObject } from "../../utils/observableObject";
import { IObservableErrors, ObservableErrors } from "../../utils/observableErrors";
import { propertyOf } from "../../utils/types";
import { Validator, MinMaxStringLength, EqualToOtherString } from "../../utils/validator";
import { DelegateCommand, ICommand } from "../../utils/command";
import { AccountService } from "./accountService";

export class AccountViewModel extends ObservableObject<AccountViewModel> implements IObservableErrors {
    private readonly _accountService: AccountService;
    private _errors = new ObservableErrors();
    private _validator: Validator<AccountViewModel>;

    private _formFields = {
        newPassword: '',
        confirmNewPassword: ''
    };

    private _formFieldsTouched = new Set<string>();

    private _submitCommand: DelegateCommand;

    get newPassword(): string {
        return this._formFields.newPassword;
    }
    set newPassword(value: string) {
        this.setAndValidate('newPassword', value);
    }

    get confirmNewPassword(): string {
        return this._formFields.confirmNewPassword;
    }
    set confirmNewPassword(value: string) {
        this.setAndValidate('confirmNewPassword', value);
    }

    get submitButtonText(): string {
        return this.hasPassword ? 'Update Password' : 'Create Password';
    }

    get username(): string {
        return this._accountService.username;
    }

    get hasPassword(): boolean {
        return this._accountService.hasPassword;
    }

    get passwordUpdated(): boolean {
        return this._accountService.passwordUpdated;
    }

    get errorUpdating(): boolean {
        return this._accountService.error;
    }

    get submitCommand(): ICommand {
        return this._submitCommand;
    }

    get errors(): ObservableErrors {
        return this._errors;
    }

    constructor(accountService: AccountService) {
        super();

        this._accountService = accountService;

        this._validator = new Validator(this, [
            new MinMaxStringLength('newPassword', 6, 100, 'New Password'),
            new EqualToOtherString('confirmNewPassword', 'newPassword', 'New Password', 'Confirm New Password')
        ]);

        this._submitCommand = new DelegateCommand(
            () => {
                if (!this.validateAll(true)) {
                    return;
                }

                accountService.submit(this.newPassword);
            },
            () => !this._errors.hasErrors);
    }

    private setAndValidate(propertyName: propertyOf<AccountViewModel>, value: any) {
        if (this.setAndRaise(this._formFields, propertyName, value)) {
            this._formFieldsTouched.add(propertyName as string);
            this.validateAll();
        }
    }

    private validateAll(force = false): boolean {
        let success = true;

        for (let propertyName in this._formFields) {
            if (!force && !this._formFieldsTouched.has(propertyName)) {
                continue;
            }

            let validationResult = this._validator.validate(propertyName);
            this.errors.setError(propertyName, validationResult);

            if (!validationResult.valid) {
                success = false;
            }
        }

        this._submitCommand.raiseCanExecuteChanged();

        return success;
    }
}