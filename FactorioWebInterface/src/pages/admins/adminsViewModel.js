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
import { Observable } from "../../utils/observable";
import { ObservableErrors } from "../../utils/observableErrors";
import { Validator, PropertyValidation, ValidationResult } from "../../utils/validation/module";
export class AdminsViewModel extends ObservableObject {
    constructor(adminsService) {
        super();
        this._addAdminsText = '';
        this._adminListHeader = 'Admin List (fetching...)';
        this._errors = new ObservableErrors();
        this._errorObservable = new Observable();
        this._adminsService = adminsService;
        this._validator = new Validator(this, [
            new PropertyValidation('addAdminsText').displayName('Text').rules({
                validate: (value) => {
                    if (!value || value.search(/[^,\s]/) === -1) {
                        return ValidationResult.error('contain at least one non \',\' (comma) or \' \' (whitespace) character');
                    }
                    else {
                        return ValidationResult.validResult;
                    }
                }
            })
        ]);
        this.admins.subscribe((event) => {
            let header = `Admin List (${this.admins.count})`;
            this.setAdminListHeader(header);
        });
    }
    get addAdminsText() {
        return this._addAdminsText;
    }
    set addAdminsText(text) {
        if (text === this._addAdminsText) {
            return;
        }
        this._addAdminsText = text;
        this.raise('addAdminsText', text);
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
    onError(callback) {
        return this._errorObservable.subscribe(callback);
    }
    addAdmins() {
        return __awaiter(this, void 0, void 0, function* () {
            let validationResult = this._validator.validate('addAdminsText');
            this.errors.setError('addAdminsText', validationResult);
            if (!validationResult.valid) {
                return;
            }
            let error = yield this._adminsService.addAdmins(this._addAdminsText);
            if (error) {
                this._errorObservable.raise(error);
            }
        });
    }
    removeAdmin(admin) {
        return __awaiter(this, void 0, void 0, function* () {
            let error = yield this._adminsService.removeAdmin(admin);
            if (error) {
                this._errorObservable.raise(error);
            }
        });
    }
}
//# sourceMappingURL=adminsViewModel.js.map