import { ObservableObject } from "../../utils/observableObject";
import { IObservableErrors, ObservableErrors } from "../../utils/observableErrors";
import { ServerSettingsService } from "./serverSettingsService";
import { FactorioServerSettings, FactorioServerSettingsType } from "./serversTypes";
import { DelegateCommand, ICommand } from "../../utils/command";
import { CollectionChangeType, Utils } from "../../ts/utils";
import { CopyToClipboardService } from "../../services/copyToClipboardService";
import { MathHelper } from "../../utils/mathHelper";
import { ErrorService } from "../../services/errorService";
import { propertyOf } from "../../utils/types";
import { PropertyValidation, Validator } from "../../utils/validation/module";

interface FormFields {
    Name: string;
    Description: string;
    Tags: string;
    MaxPlayers: number;
    GamePassword: string;
    MaxUploadSlots: number;
    AutoPause: boolean;
    UseDefaultAdmins: boolean;
    Admins: string;
    AutosaveInterval: number;
    AutosaveSlots: number;
    NonBlockingSaving: boolean;
    PublicVisible: boolean;
    AfkAutokickInterval: number;
}

export class ServerSettingsViewModel extends ObservableObject<ServerSettingsViewModel> implements IObservableErrors {
    static readonly normalPasteText = 'Paste settings here';
    static readonly errorPasteText = 'Invalid settings';
    static readonly appliedPasteText = 'Settings applied';

    static readonly formFieldsDefaultValues: FormFields = {
        Name: '',
        Description: '',
        Tags: '',
        MaxPlayers: 0,
        GamePassword: '',
        MaxUploadSlots: 32,
        AutoPause: true,
        UseDefaultAdmins: true,
        Admins: '',
        AutosaveInterval: 5,
        AutosaveSlots: 20,
        NonBlockingSaving: true,
        PublicVisible: true,
        AfkAutokickInterval: 0
    }

    private _suppressUpdate = false;
    private _changesDuringSupression = false;

    private _serverSettingsService: ServerSettingsService;
    private _copyToClipoardService: CopyToClipboardService;
    private _errorService: ErrorService;

    private _formFields: FormFields = Object.assign({}, ServerSettingsViewModel.formFieldsDefaultValues);

    private _saved: boolean;

    private _validator: Validator<ServerSettingsViewModel>;
    private _errors = new ObservableErrors();

    private _saveCommand: DelegateCommand;
    private _undoCommand: DelegateCommand;
    private _copyCommand: DelegateCommand;

    private _pasteText = ServerSettingsViewModel.normalPasteText;

    get Name() {
        return this._formFields.Name;
    }
    set Name(value: string) {
        let trimmedValue = value.trim();
        this.setField('Name', trimmedValue, true);
    }

    get Description() {
        return this._formFields.Description;
    }
    set Description(value: string) {
        let trimmedValue = value.trim();
        this.setField('Description', trimmedValue, true);
    }

    get Tags() {
        return this._formFields.Tags;
    }
    set Tags(value: string) {
        let trimmedValue = value.trim();
        this.setField('Tags', trimmedValue, true);
    }

    get MaxPlayers() {
        return this._formFields.MaxPlayers;
    }
    set MaxPlayers(value: number) {
        value = MathHelper.toIntegerOrDefault(value);
        if (value < 0) {
            value = ServerSettingsViewModel.formFieldsDefaultValues.MaxPlayers;
        }

        this.setField('MaxPlayers', value, true);
    }

    get GamePassword() {
        return this._formFields.GamePassword;
    }
    set GamePassword(value: string) {
        this.setField('GamePassword', value);
    }

    get MaxUploadSlots() {
        return this._formFields.MaxUploadSlots;
    }
    set MaxUploadSlots(value: number) {
        value = MathHelper.toIntegerOrDefault(value);
        if (value < 0) {
            value = ServerSettingsViewModel.formFieldsDefaultValues.MaxUploadSlots;
        }

        this.setField('MaxUploadSlots', value, true);
    }

    get AutoPause() {
        return this._formFields.AutoPause;
    }
    set AutoPause(value: boolean) {
        this.setField('AutoPause', value);
    }

    get UseDefaultAdmins() {
        return this._formFields.UseDefaultAdmins;
    }
    set UseDefaultAdmins(value: boolean) {
        if (this.setField('UseDefaultAdmins', value)) {
            this.raise('adminsEditEnabled', this.adminsEditEnabled);
        }
    }

    get Admins() {
        return this._formFields.Admins;
    }
    set Admins(value: string) {
        let trimmedValue = value.trim();
        this.setField('Admins', trimmedValue, true);
    }

    get AutosaveInterval() {
        return this._formFields.AutosaveInterval;
    }
    set AutosaveInterval(value: number) {
        value = MathHelper.toIntegerOrDefault(value);
        if (value < 1) {
            value = ServerSettingsViewModel.formFieldsDefaultValues.AutosaveInterval;
        }

        this.setField('AutosaveInterval', value, true);
    }

    get AutosaveSlots() {
        return this._formFields.AutosaveSlots;
    }
    set AutosaveSlots(value: number) {
        value = MathHelper.toIntegerOrDefault(value);
        if (value < 0) {
            value = ServerSettingsViewModel.formFieldsDefaultValues.AutosaveSlots;
        }

        this.setField('AutosaveSlots', value, true);
    }

    get NonBlockingSaving() {
        return this._formFields.NonBlockingSaving;
    }
    set NonBlockingSaving(value: boolean) {
        this.setField('NonBlockingSaving', value);
    }

    get PublicVisible() {
        return this._formFields.PublicVisible;
    }
    set PublicVisible(value: boolean) {
        this.setField('PublicVisible', value);
    }

    get AfkAutokickInterval() {
        return this._formFields.AfkAutokickInterval;
    }
    set AfkAutokickInterval(value: number) {
        value = MathHelper.toIntegerOrDefault(value);
        if (value < 0) {
            value = ServerSettingsViewModel.formFieldsDefaultValues.AfkAutokickInterval;
        }

        this.setField('AfkAutokickInterval', value, true);
    }

    get saved(): boolean {
        return this._saved;
    }
    private setSaved(value: boolean) {
        if (this._saved === value) {
            return;
        }

        this._saved = value;
        this.raise('saved', value);
        this._saveCommand.raiseCanExecuteChanged();
        this._undoCommand.raiseCanExecuteChanged();
    }

    get adminsEditEnabled(): boolean {
        return !this._formFields.UseDefaultAdmins;
    }

    get errors(): ObservableErrors {
        return this._errors;
    }

    get saveCommand(): ICommand {
        return this._saveCommand;
    }

    get undoCommand(): ICommand {
        return this._undoCommand;
    }

    get copyCommand(): ICommand {
        return this._copyCommand;
    }

    get pasteText(): string {
        return this._pasteText;
    }
    private setPasteText(value: string) {
        if (this._pasteText == value) {
            return;
        }

        this._pasteText = value;
        this.raise('pasteText', value);
    }

    constructor(serverSettingsService: ServerSettingsService, copyToClipoardService: CopyToClipboardService, errorService: ErrorService) {
        super();

        this._serverSettingsService = serverSettingsService;
        this._copyToClipoardService = copyToClipoardService;
        this._errorService = errorService;

        this._validator = new Validator<this>(this, [
            new PropertyValidation('Name').maxStringLength(49)
        ]);

        this._saveCommand = new DelegateCommand(() => this.saveSettings(), () => !this.saved);
        this._undoCommand = new DelegateCommand(() => this._serverSettingsService.undoSettings(), () => !this.saved);
        this._copyCommand = new DelegateCommand(() => this.copySettings());

        this.update(serverSettingsService.settings);
        serverSettingsService.settingsChanged.subscribe(event => this.update(event.NewItems as FactorioServerSettings));

        this._saved = serverSettingsService.saved;
        serverSettingsService.savedChanged.subscribe(event => this.setSaved(event));
    }

    private setAndDoValidation(propertyName: propertyOf<ServerSettingsViewModel>, value: any): boolean {
        if (this.setAndRaise(this._formFields, propertyName, value)) {
            let validationResult = this._validator.validate(propertyName);
            this.errors.setError(propertyName, validationResult);
            return true;
        }

        return false;
    }

    private update(settings: FactorioServerSettings) {
        for (let propertyName in settings) {
            let value = ServerSettingsViewModel.convertToFormField(propertyName as FactorioServerSettingsType, settings[propertyName])
            if (this.setAndDoValidation(propertyName as propertyOf<ServerSettingsViewModel>, value) && propertyName === 'UseDefaultAdmins') {
                this.raise('adminsEditEnabled', this.adminsEditEnabled);
            }
        }
    }

    private setField(propertyName: propertyOf<ServerSettingsViewModel>, value: any, forceRaise?: boolean): boolean {
        if (this.setAndDoValidation(propertyName, value)) {
            this.setSaved(false);

            if (!this._suppressUpdate) {
                let settingValue = ServerSettingsViewModel.convertToFactorioServerSettings(propertyName as FactorioServerSettingsType, value);
                let settings = {};
                settings[propertyName] = settingValue;
                this._serverSettingsService.updateSettings({ Type: CollectionChangeType.Add, NewItems: settings });
            } else {
                this._changesDuringSupression = true;
            }

            return true;
        }

        if (forceRaise) {
            this.raise(propertyName, value);
        }

        return false;
    }

    private static convertToFormField(key: FactorioServerSettingsType, settingValue: any): any {
        if (settingValue == null) {
            return ServerSettingsViewModel.formFieldsDefaultValues[key];
        }

        switch (key) {
            case 'Name':
            case 'Description':
            case 'GamePassword': {
                return settingValue + '';
            }
            case 'MaxPlayers':
            case 'MaxUploadSlots':
            case 'AutosaveInterval':
            case 'AutosaveSlots':
            case 'AfkAutokickInterval': {
                settingValue = Number(settingValue);
                if (isNaN(settingValue)) {
                    settingValue = null;
                }

                break;
            }
            case 'AutoPause':
            case 'UseDefaultAdmins':
            case 'NonBlockingSaving':
            case 'PublicVisible': {
                return Boolean(settingValue);
            }
            case 'Tags': {
                if (!Array.isArray(settingValue)) {
                    settingValue = null;
                    break;
                }

                let tags = settingValue as string[];
                return tags.map(s => s + '').join('\n');
            }
            case 'Admins': {
                if (!Array.isArray(settingValue)) {
                    settingValue = null;
                    break;
                }

                let admins = settingValue as string[];
                return admins.map(s => (s + '').trim()).join(', ');
            }
            default: return null;
        }

        return settingValue ?? ServerSettingsViewModel.formFieldsDefaultValues[key];
    }

    private static convertToFactorioServerSettings(key: FactorioServerSettingsType, fieldValue: any): any {
        let value = fieldValue ?? ServerSettingsViewModel.formFieldsDefaultValues[key as string];

        switch (key) {
            case 'Name': return value.trim();
            case 'Description': return value.trim();
            case 'Tags': {
                let tags = value as string;
                tags = tags.trim();
                return tags === '' ? [] : tags.split('\n');
            }
            case 'Admins': {
                let adminsText = value as string;
                adminsText = adminsText.trim();

                if (adminsText === '') {
                    return [];
                }

                let admins = adminsText.split(',');

                for (let i = 0; i < admins.length; i++) {
                    admins[i] = admins[i].trim();
                }

                return admins;
            }
            default: return value;
        }
    }

    private buildFactorioServerSettings(): FactorioServerSettings {
        let settings = {} as FactorioServerSettings;
        let fields = this._formFields;

        for (let propertyName in fields) {
            let key = propertyName as FactorioServerSettingsType;
            let value = ServerSettingsViewModel.convertToFactorioServerSettings(key, fields[propertyName]);
            settings[propertyName] = value;
        }

        return settings;
    }

    private async saveSettings() {
        let settings = this.buildFactorioServerSettings();

        let result = await this._serverSettingsService.saveSettings(settings);
        this._errorService.reportIfError(result);
    }

    private copySettings() {
        let settings = this.buildFactorioServerSettings();
        let text = JSON.stringify(settings);
        this._copyToClipoardService.copy(text);
    }

    pasteSettingsClicked() {
        this.setPasteText(ServerSettingsViewModel.normalPasteText);
    }

    pasteSettings(text: string) {
        let settings;
        try {
            settings = JSON.parse(text);
        }
        catch (ex) {
            this.setPasteText(ServerSettingsViewModel.errorPasteText);
            return;
        }

        if (!Utils.isObject(settings)) {
            this.setPasteText(ServerSettingsViewModel.errorPasteText);
            return;
        }

        let fields = this._formFields;
        let changeData = {};

        try {
            this._suppressUpdate = true;
            this._changesDuringSupression = false;

            for (let propertyName in settings) {
                if (!fields.hasOwnProperty(propertyName)) {
                    continue;
                }

                let value = ServerSettingsViewModel.convertToFormField(propertyName as FactorioServerSettingsType, settings[propertyName]);
                if (value == null) {
                    continue;
                }

                this[propertyName] = value;
                changeData[propertyName] = ServerSettingsViewModel.convertToFactorioServerSettings(propertyName as FactorioServerSettingsType, this[propertyName]);
            }

            if (this._changesDuringSupression) {
                this._serverSettingsService.updateSettings({ Type: CollectionChangeType.Add, NewItems: changeData });
            }

            this.setPasteText(ServerSettingsViewModel.appliedPasteText);
        } finally {
            this._suppressUpdate = false;
        }
    }
}