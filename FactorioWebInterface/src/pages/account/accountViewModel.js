import { ObservableObject } from "../../utils/observableObject";
import { ObservableErrors } from "../../utils/observableErrors";
import { DelegateCommand } from "../../utils/command";
import { Validator, PropertyValidation } from "../../utils/validation/module";
export class AccountViewModel extends ObservableObject {
    constructor(accountService) {
        super();
        this._errors = new ObservableErrors();
        this._formFields = {
            newPassword: '',
            confirmNewPassword: ''
        };
        this._formFieldsTouched = new Set();
        this._accountService = accountService;
        this._validator = new Validator(this, [
            new PropertyValidation('newPassword').displayName('New Password')
                .minMaxStringLength(6, 100),
            new PropertyValidation('confirmNewPassword').displayName('Confirm New Password')
                .equalToOtherString('newPassword', 'New Password')
        ]);
        this._submitCommand = new DelegateCommand(() => {
            if (!this.validateAll(true)) {
                return;
            }
            accountService.submit(this.newPassword);
        }, () => !this._errors.hasErrors);
    }
    get newPassword() {
        return this._formFields.newPassword;
    }
    set newPassword(value) {
        this.setAndValidate('newPassword', value);
    }
    get confirmNewPassword() {
        return this._formFields.confirmNewPassword;
    }
    set confirmNewPassword(value) {
        this.setAndValidate('confirmNewPassword', value);
    }
    get submitButtonText() {
        return this.hasPassword ? 'Update Password' : 'Create Password';
    }
    get username() {
        return this._accountService.username;
    }
    get hasPassword() {
        return this._accountService.hasPassword;
    }
    get passwordUpdated() {
        return this._accountService.passwordUpdated;
    }
    get errorUpdating() {
        return this._accountService.error;
    }
    get submitCommand() {
        return this._submitCommand;
    }
    get errors() {
        return this._errors;
    }
    setAndValidate(propertyName, value) {
        if (this.setAndRaise(this._formFields, propertyName, value)) {
            this._formFieldsTouched.add(propertyName);
            this.validateAll();
        }
    }
    validateAll(force = false) {
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
//# sourceMappingURL=accountViewModel.js.map