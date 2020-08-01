import { UploadService, FileUploadEventType } from "../../services/uploadService";
import { WindowService } from "../../services/windowService";
import { IHiddenInputService } from "../../services/iHiddenInputService";
import { NavigationHistoryService } from "../../services/navigationHistoryService";

export class AccountService {
    private readonly _uploadService: UploadService;
    private readonly _windowService: WindowService;

    private _username = '';
    private _hasPassword = false;
    private _passwordUpdated = false;
    private _error = false;

    get username(): string {
        return this._username;
    }

    get hasPassword(): boolean {
        return this._hasPassword;
    }

    get passwordUpdated(): boolean {
        return this._passwordUpdated;
    }

    get error(): boolean {
        return this._error;
    }

    constructor(uploadService: UploadService, windowService: WindowService, hiddenInputService: IHiddenInputService) {
        this._uploadService = uploadService;
        this._windowService = windowService;

        this._username = hiddenInputService.getValue('__username');
        this._hasPassword = Boolean(hiddenInputService.getValue('__hasPassword'));
        this._passwordUpdated = Boolean(hiddenInputService.getValue('__passwordUpdated'));
        this._error = Boolean(hiddenInputService.getValue('__accountError'));
    }

    submit(password: string): void {
        let formData = this._windowService.createFormData();
        formData.append('Input.Password', password);

        this._uploadService.submitForm('/admin/account?handler=UpdatePassword', formData);
    }
}