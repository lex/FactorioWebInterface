import { ObservableObject } from "../../utils/observableObject";
import { Observable } from "../../utils/observable";
import { BansService } from "./bansService";
import { IObservableErrors, ObservableErrors } from "../../utils/observableErrors";
import { Validator, PropertyValidation } from "../../utils/validation/module";
import { CollectionView } from "../../utils/collections/module";
import { ErrorService } from "../../services/errorService";
import { Ban } from "./ban";
import { DelegateCommand, ICommand } from "../../utils/command";

export class BansViewModel extends ObservableObject implements IObservableErrors {
    private _bansService: BansService
    private _errorService: ErrorService;

    private _bans: CollectionView<Ban, string>;

    private _formFields = {
        username: '',
        reason: '',
        admin: '',
        date: null as Date,
        time: null as Date,
        synchronizeWithServers: true
    };
    private _validator: Validator<BansViewModel>;
    private _errors = new ObservableErrors();

    private _banListHeader = 'Bans (fetching...)';

    private _addBanCommand: DelegateCommand;
    private _removeBanCommand: DelegateCommand<Ban>;

    get bans(): CollectionView<Ban, string> {
        return this._bans;
    }

    get banListHeader(): string {
        return this._banListHeader;
    }

    get username(): string {
        return this._formFields.username;
    }
    set username(value: string) {
        this.set('username', value);
    }

    get reason(): string {
        return this._formFields.reason;
    }
    set reason(value: string) {
        this.set('reason', value);
    }

    get admin(): string {
        return this._formFields.admin;
    }
    set admin(value: string) {
        this.set('admin', value);
    }

    get date(): Date {
        return this._formFields.date;
    }
    set date(value: Date) {
        this.set('date', value);
    }

    get time(): Date {
        return this._formFields.time;
    }
    set time(value: Date) {
        this.set('time', value);
    }

    get synchronizeWithServers(): boolean {
        return this._formFields.synchronizeWithServers;
    }
    set synchronizeWithServers(value: boolean) {
        this.setAndRaise(this._formFields, 'synchronizeWithServers', value);
    }

    get addBanCommand(): ICommand {
        return this._addBanCommand;
    }

    get removeBanCommand(): ICommand<Ban> {
        return this._removeBanCommand;
    }

    private setBanListHeader(text: string) {
        if (text === this._banListHeader) {
            return;
        }

        this._banListHeader = text;
        this.raise('banListHeader', text);
    }

    private set(propertyName: string, value: any) {
        if (this.setAndRaise(this._formFields, propertyName, value)) {
            let validationResult = this._validator.validate(propertyName);
            this.errors.setError(propertyName, validationResult);
            this._addBanCommand.raiseCanExecuteChanged();
            return true;
        }

        return false;
    }

    get errors(): ObservableErrors {
        return this._errors;
    }

    constructor(bansService: BansService, errorService: ErrorService) {
        super();

        this._bansService = bansService;
        this._errorService = errorService;

        this._formFields.admin = bansService.actor ?? '';

        this._validator = new Validator<this>(this, [
            new PropertyValidation('username').displayName('Username').notEmptyString(),
            new PropertyValidation('reason').displayName('Reason').notEmptyString(),
            new PropertyValidation('admin').displayName('Admin').notEmptyString(),
            new PropertyValidation('date').displayName('Date').notNull(),
            new PropertyValidation('time').displayName('Time').notNull()
        ]);

        this._bans = new CollectionView(bansService.bans);
        this._bans.sortBy({ property: 'DateTime', ascending: false });

        this._addBanCommand = new DelegateCommand(() => this.addBan(), () => !this.errors.hasErrors);

        this._removeBanCommand = new DelegateCommand(ban => this.removeBan(ban));

        this._bansService.bans.subscribe((event) => {
            let header = `Bans (${this._bansService.bans.count})`;
            this.setBanListHeader(header);
        });

        let now = new Date();
        this.date = now;
        this.time = now;
    }

    private validateAll(): boolean {
        let success = true;

        for (let propertyName in this._formFields) {
            let validationResult = this._validator.validate(propertyName);
            this.errors.setError(propertyName, validationResult);

            if (!validationResult.valid) {
                success = false;
            }
        }

        this._addBanCommand.raiseCanExecuteChanged();
        return success;
    }

    private async addBan() {
        if (!this.validateAll()) {
            return;
        }

        let datePart = this.date;
        let timePart = this.time;
        let year = datePart.getUTCFullYear();
        let month = datePart.getUTCMonth();
        let day = datePart.getUTCDate();
        let hours = timePart.getUTCHours();
        let minutes = timePart.getUTCMinutes();
        let seconds = timePart.getUTCSeconds();

        let dateTime = new Date(0);
        dateTime.setUTCFullYear(year, month, day);
        dateTime.setUTCHours(hours, minutes, seconds);

        let ban: Ban = {
            Username: this.username,
            Admin: this.admin,
            Reason: this.reason,
            DateTime: dateTime
        };

        let result = await this._bansService.addBan(ban, true);
        this._errorService.reportIfError(result);
    }

    private async removeBan(ban: Ban) {
        this.updateFormFromBan(ban);

        let result = await this._bansService.removeBan(ban.Username, true);
        this._errorService.reportIfError(result);
    }

    updateFormFromBan(ban: Ban) {
        this.username = ban.Username;
        this.reason = ban.Reason;
        this.admin = ban.Admin;
        this.date = ban.DateTime;
        this.time = ban.DateTime;
    }
}