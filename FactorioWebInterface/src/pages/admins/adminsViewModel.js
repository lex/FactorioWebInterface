var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ObservableObject } from "../../utils/observableObject";
import { ObservableErrors } from "../../utils/observableErrors";
import { Validator, PropertyValidation } from "../../utils/validation/module";
import { AdminsTextValidationRule } from "./adminsTextValidationRule";
import { DelegateCommand } from "../../utils/command";
export class AdminsViewModel extends ObservableObject {
    constructor(adminsService, errorService) {
        super();
        this._addAdminsText = '';
        this._adminListHeader = 'Admin List (fetching...)';
        this._errors = new ObservableErrors();
        this._adminsService = adminsService;
        this._errorService = errorService;
        this._validator = new Validator(this, [
            new PropertyValidation('addAdminsText')
                .displayName('Text')
                .rules(new AdminsTextValidationRule())
        ]);
        this._addAdminsCommand = new DelegateCommand(() => this.addAdmins(), () => !this._errors.hasErrors);
        this._removeAdminCommand = new DelegateCommand((admin) => this.removeAdmin(admin));
        this._errors.errorChanged('addAdminsText', () => this._addAdminsCommand.raiseCanExecuteChanged());
        this.admins.subscribe((event) => {
            let header = `Admin List (${this.admins.count})`;
            this.setAdminListHeader(header);
        });
    }
    get addAdminsText() {
        return this._addAdminsText;
    }
    set addAdminsText(text) {
        var _a;
        let trimmedText = (_a = text === null || text === void 0 ? void 0 : text.trim()) !== null && _a !== void 0 ? _a : '';
        if (this._addAdminsText === trimmedText) {
            if (trimmedText !== text) {
                this.raise('addAdminsText', trimmedText);
            }
            return;
        }
        this._addAdminsText = trimmedText;
        this.raise('addAdminsText', trimmedText);
        let validationResult = this._validator.validate('addAdminsText');
        this.errors.setError('addAdminsText', validationResult);
    }
    get admins() {
        return this._adminsService.admins;
    }
    get adminListHeader() {
        return this._adminListHeader;
    }
    setAdminListHeader(text) {
        if (text === this._adminListHeader) {
            return;
        }
        this._adminListHeader = text;
        this.raise('adminListHeader', text);
    }
    get errors() {
        return this._errors;
    }
    get addAdminsCommand() {
        return this._addAdminsCommand;
    }
    get removeAdminCommand() {
        return this._removeAdminCommand;
    }
    addAdmins() {
        return __awaiter(this, void 0, void 0, function* () {
            let validationResult = this._validator.validate('addAdminsText');
            this.errors.setError('addAdminsText', validationResult);
            if (!validationResult.valid) {
                return;
            }
            let result = yield this._adminsService.addAdmins(this._addAdminsText);
            this._errorService.reportIfError(result);
        });
    }
    removeAdmin(admin) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield this._adminsService.removeAdmin(admin.Name);
            this._errorService.reportIfError(result);
        });
    }
}
//# sourceMappingURL=adminsViewModel.js.map