import { ObservableObject } from "../../utils/observableObject";
import { AdminsService, Admin } from "./adminsService";
import { Observable } from "../../utils/observable";
import { ObservableCollection } from "../../utils/observableCollection";
import { IObservableErrors, ObservableErrors } from "../../utils/observableErrors";
import { Validator, ValidationRule, ValidationResult } from "../../utils/validator";

export class AdminsViewModel extends ObservableObject implements IObservableErrors {
    private _adminsService: AdminsService

    private _addAdminsText = '';
    private _adminListHeader = 'Admin List (fetching...)';

    private _validator: Validator<AdminsViewModel>;
    private _errors = new ObservableErrors();

    private _errorObservable = new Observable<string>();

    get addAdminsText(): string {
        return this._addAdminsText;
    }
    set addAdminsText(text: string) {
        if (text === this._addAdminsText) {
            return;
        }

        this._addAdminsText = text;
        this.raise('addAdminsText', text);
        let validationResult = this._validator.validate('addAdminsText');
        this.errors.setError('addAdminsText', validationResult);
    }

    get admins(): ObservableCollection<Admin> {
        return this._adminsService.admins;
    }

    get adminListHeader(): string {
        return this._adminListHeader;
    }

    private setAdminListHeader(text: string) {
        if (text === this._adminListHeader) {
            return;
        }

        this._adminListHeader = text;
        this.raise('adminListHeader', text);
    }

    get errors() {
        return this._errors;
    }

    constructor(adminsService: AdminsService) {
        super();

        this._adminsService = adminsService;

        this._validator = new Validator(this, [
            new ValidationRule('addAdminsText', (obj) => {
                let prop = obj.addAdminsText;

                if (!prop || prop.search(/[^,\s]/) === -1) {
                    return ValidationResult.error('Text must contain at least one non \',\' (comma) or \' \' (whitespace) character.');
                } else {
                    return ValidationResult.validResult;
                }
            })
        ]);

        this.admins.subscribe((event) => {
            let header = `Admin List (${this.admins.count})`;
            this.setAdminListHeader(header);
        });
    }

    onError(callback: (event: string) => void): () => void {
        return this._errorObservable.subscribe(callback);
    }

    async addAdmins() {
        let validationResult = this._validator.validate('addAdminsText');
        this.errors.setError('addAdminsText', validationResult);
        if (!validationResult.valid) {
            return;
        }

        let error = await this._adminsService.addAdmins(this._addAdminsText)
        if (error) {
            this._errorObservable.raise(error);
        }
    }

    async removeAdmin(admin: Admin) {
        let error = await this._adminsService.removeAdmin(admin)
        if (error) {
            this._errorObservable.raise(error);
        }
    }
}