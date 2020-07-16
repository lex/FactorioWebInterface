export class AccountService {
    constructor(uploadService, windowService, hiddenInputService) {
        this._username = '';
        this._hasPassword = false;
        this._passwordUpdated = false;
        this._error = false;
        this._uploadService = uploadService;
        this._windowService = windowService;
        this._username = hiddenInputService.getValue('__username');
        this._hasPassword = Boolean(hiddenInputService.getValue('__hasPassword'));
        this._passwordUpdated = Boolean(hiddenInputService.getValue('__passwordUpdated'));
        this._error = Boolean(hiddenInputService.getValue('__accountError'));
    }
    get username() {
        return this._username;
    }
    get hasPassword() {
        return this._hasPassword;
    }
    get passwordUpdated() {
        return this._passwordUpdated;
    }
    get error() {
        return this._error;
    }
    submit(password) {
        let formData = this._windowService.createFormData();
        formData.append('Input.Password', password);
        this._uploadService.submitForm('/admin/account?handler=UpdatePassword', formData);
    }
}
//# sourceMappingURL=accountService.js.map