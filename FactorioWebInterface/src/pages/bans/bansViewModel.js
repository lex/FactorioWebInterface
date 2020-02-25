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
import { Validator, NotEmptyString, NotNull } from "../../utils/validator";
export class BansViewModel extends ObservableObject {
    constructor(bansService) {
        super();
        this._formFields = {
            username: '',
            reason: '',
            admin: '',
            date: null,
            time: null,
            synchronizeWithServers: true
        };
        this._errors = new ObservableErrors();
        this._banListHeader = 'Bans (fetching...)';
        this._errorObservable = new Observable();
        this._bansService = bansService;
        this._validator = new Validator(this, [
            new NotEmptyString('username', 'Username'),
            new NotEmptyString('reason', 'Reason'),
            new NotEmptyString('admin', 'Admin'),
            new NotNull('date', 'Date'),
            new NotNull('time', 'Time')
        ]);
        this.bans.subscribe((event) => {
            let header = `Bans (${this.bans.count})`;
            this.setBanListHeader(header);
        });
        let now = new Date();
        this.date = now;
        this.time = now;
    }
    get bans() {
        return this._bansService.bans;
    }
    get banListHeader() {
        return this._banListHeader;
    }
    get username() {
        return this._formFields.username;
    }
    set username(value) {
        this.set('username', value);
    }
    get reason() {
        return this._formFields.reason;
    }
    set reason(value) {
        this.set('reason', value);
    }
    get admin() {
        return this._formFields.admin;
    }
    set admin(value) {
        this.set('admin', value);
    }
    get date() {
        return this._formFields.date;
    }
    set date(value) {
        this.set('date', value);
    }
    get time() {
        return this._formFields.time;
    }
    set time(value) {
        this.set('time', value);
    }
    get synchronizeWithServers() {
        return this._formFields.synchronizeWithServers;
    }
    set synchronizeWithServers(value) {
        this.setAndRaise(this._formFields, 'synchronizeWithServers', value);
    }
    setBanListHeader(text) {
        if (text === this._banListHeader) {
            return;
        }
        this._banListHeader = text;
        this.raise('banListHeader', text);
    }
    set(propertyName, value) {
        if (this.setAndRaise(this._formFields, propertyName, value)) {
            let validationResult = this._validator.validate(propertyName);
            this.errors.setError(propertyName, validationResult);
            return true;
        }
        return false;
    }
    get errors() {
        return this._errors;
    }
    onError(callback) {
        return this._errorObservable.subscribe(callback);
    }
    validateAll() {
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
    addBan() {
        return __awaiter(this, void 0, void 0, function* () {
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
            let ban = {
                Username: this.username,
                Admin: this.admin,
                Reason: this.reason,
                DateTime: dateTime
            };
            let error = yield this._bansService.addBan(ban, true);
            if (error) {
                this._errorObservable.raise(error);
            }
        });
    }
    removeAdmin(ban) {
        return __awaiter(this, void 0, void 0, function* () {
            this.updateFormFromBan(ban);
            let error = yield this._bansService.removeBan(ban.Username, true);
            if (error) {
                this._errorObservable.raise(error);
            }
        });
    }
    updateFormFromBan(ban) {
        this.username = ban.Username;
        this.reason = ban.Reason;
        this.admin = ban.Admin;
        this.date = ban.DateTime;
        this.time = ban.DateTime;
    }
}
//# sourceMappingURL=bansViewModel.js.map