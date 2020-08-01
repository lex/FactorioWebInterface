import { ObservableObject } from "../../utils/observableObject";
import { AdminsService } from "./adminsService";
import { IObservableErrors, ObservableErrors } from "../../utils/observableErrors";
import { Validator, PropertyValidation, ValidationResult } from "../../utils/validation/module";
import { CollectionView } from "../../utils/collections/module";
import { Admin } from "./adminsTypes";
import { ErrorService } from "../../services/errorService";
import { AdminsTextValidationRule } from "./adminsTextValidationRule";
import { DelegateCommand, ICommand } from "../../utils/command";
import { ComparatorHelper } from "../../utils/comparatorHelper";

export class AdminsViewModel extends ObservableObject implements IObservableErrors {
    private _adminsService: AdminsService
    private _errorService: ErrorService;

    private _addAdminsText = '';
    private _adminListHeader = 'Admin List (fetching...)';

    private _admins: CollectionView<Admin>;

    private _validator: Validator<AdminsViewModel>;
    private _errors = new ObservableErrors();

    private _addAdminsCommand: DelegateCommand;
    private _removeAdminCommand: DelegateCommand<Admin>;

    get addAdminsText(): string {
        return this._addAdminsText;
    }
    set addAdminsText(text: string) {
        let trimmedText = text?.trim() ?? '';

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

    get admins(): CollectionView<Admin> {
        return this._admins;
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

    get addAdminsCommand(): ICommand {
        return this._addAdminsCommand;
    }

    get removeAdminCommand(): ICommand<Admin> {
        return this._removeAdminCommand;
    }

    constructor(adminsService: AdminsService, errorService: ErrorService) {
        super();

        this._adminsService = adminsService;
        this._errorService = errorService;

        this._admins = new CollectionView(adminsService.admins);
        this._admins.sortBy({ property: 'Name', ascendingComparator: ComparatorHelper.buildCaseInsensitiveStringComparatorForProperty('Name') });

        this._validator = new Validator<this>(this, [
            new PropertyValidation('addAdminsText')
                .displayName('Text')
                .rules(new AdminsTextValidationRule())
        ]);

        this._addAdminsCommand = new DelegateCommand(() => this.addAdmins(), () => !this._errors.hasErrors);

        this._removeAdminCommand = new DelegateCommand((admin: Admin) => this.removeAdmin(admin));

        this._errors.errorChanged('addAdminsText', () => this._addAdminsCommand.raiseCanExecuteChanged());

        adminsService.admins.subscribe((event) => {
            let header = `Admin List (${this._adminsService.admins.count})`;
            this.setAdminListHeader(header);
        });
    }

    private async addAdmins() {
        let validationResult = this._validator.validate('addAdminsText');
        this.errors.setError('addAdminsText', validationResult);
        if (!validationResult.valid) {
            return;
        }

        let result = await this._adminsService.addAdmins(this._addAdminsText);
        if (result.Success) {
            this._addAdminsText = '';
            this.raise('addAdminsText', this._addAdminsText);
            this.errors.setError('addAdminsText', ValidationResult.validResult);
        }

        this._errorService.reportIfError(result);
    }

    private async removeAdmin(admin: Admin) {
        let result = await this._adminsService.removeAdmin(admin.Name);
        this._errorService.reportIfError(result);
    }
}