import { ObservableObject } from "../../utils/observableObject";
import { Observable } from "../../utils/observable";
import { ObservableCollection } from "../../utils/observableCollection";
import { BansService, Ban } from "./bansService";
import { IObservableErrors, ObservableErrors } from "../../utils/observableErrors";
import { Validator, PropertyValidation } from "../../utils/validation/module";

export class BansViewModel extends ObservableObject implements IObservableErrors {
    private _bansService: BansService

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

    private _errorObservable = new Observable<string>();

    get bans(): ObservableCollection<Ban> {
        return this._bansService.bans;
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
            return true;
        }

        return false;
    }

    get errors(): ObservableErrors {
        return this._errors;
    }

    constructor(bansService: BansService) {
        super();

        this._bansService = bansService;

        this._validator = new Validator<this>(this, [
            new PropertyValidation('username').displayName('Username').notEmptyString(),
            new PropertyValidation('reason').displayName('Reason').notEmptyString(),
            new PropertyValidation('admin').displayName('Admin').notEmptyString(),
            new PropertyValidation('date').displayName('Date').notNull(),
            new PropertyValidation('time').displayName('Time').notNull()
        ]);

        this.bans.subscribe((event) => {
            let header = `Bans (${this.bans.count})`;
            this.setBanListHeader(header);
        });

        let now = new Date();
        this.date = now;
        this.time = now;
    }

    onError(callback: (event: string) => void): () => void {
        return this._errorObservable.subscribe(callback);
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

        return success;
    }

    async addBan() {
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

        let error = await this._bansService.addBan(ban, true)
        if (error) {
            this._errorObservable.raise(error);
        }
    }

    async removeAdmin(ban: Ban) {
        this.updateFormFromBan(ban);

        let error = await this._bansService.removeBan(ban.Username, true)
        if (error) {
            this._errorObservable.raise(error);
        }
    }

    updateFormFromBan(ban: Ban) {
        this.username = ban.Username;
        this.reason = ban.Reason;
        this.admin = ban.Admin;
        this.date = ban.DateTime;
        this.time = ban.DateTime;
    }
}