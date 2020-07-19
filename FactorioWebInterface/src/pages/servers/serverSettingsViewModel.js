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
import { DelegateCommand } from "../../utils/command";
import { CollectionChangeType, Utils } from "../../ts/utils";
import { MathHelper } from "../../utils/mathHelper";
import { PropertyValidation, Validator } from "../../utils/validation/module";
export class ServerSettingsViewModel extends ObservableObject {
    constructor(serverSettingsService, copyToClipoardService, errorService) {
        super();
        this._suppressUpdate = false;
        this._formFields = Object.assign({}, ServerSettingsViewModel.formFieldsDefaultValues);
        this._errors = new ObservableErrors();
        this._pasteText = ServerSettingsViewModel.normalPasteText;
        this._serverSettingsService = serverSettingsService;
        this._copyToClipoardService = copyToClipoardService;
        this._errorService = errorService;
        this._validator = new Validator(this, [
            new PropertyValidation('Name').maxStringLength(49)
        ]);
        this._saveCommand = new DelegateCommand(() => this.saveSettings(), () => !this.saved);
        this._undoCommand = new DelegateCommand(() => this._serverSettingsService.undoSettings(), () => !this.saved);
        this._copyCommand = new DelegateCommand(() => this.copySettings());
        this.update(serverSettingsService.settings);
        serverSettingsService.settingsChanged.subscribe(event => this.update(event.NewItems));
        this._saved = serverSettingsService.saved;
        serverSettingsService.savedChanged.subscribe(event => this.setSaved(event));
    }
    get Name() {
        return this._formFields.Name;
    }
    set Name(value) {
        let trimmedValue = value.trim();
        this.setField('Name', trimmedValue, true);
    }
    get Description() {
        return this._formFields.Description;
    }
    set Description(value) {
        let trimmedValue = value.trim();
        this.setField('Description', trimmedValue, true);
    }
    get Tags() {
        return this._formFields.Tags;
    }
    set Tags(value) {
        let trimmedValue = value.trim();
        this.setField('Tags', trimmedValue, true);
    }
    get MaxPlayers() {
        return this._formFields.MaxPlayers;
    }
    set MaxPlayers(value) {
        value = MathHelper.toIntegerOrDefault(value);
        if (value < 0) {
            value = ServerSettingsViewModel.formFieldsDefaultValues.MaxPlayers;
        }
        this.setField('MaxPlayers', value, true);
    }
    get GamePassword() {
        return this._formFields.GamePassword;
    }
    set GamePassword(value) {
        this.setField('GamePassword', value);
    }
    get MaxUploadSlots() {
        return this._formFields.MaxUploadSlots;
    }
    set MaxUploadSlots(value) {
        value = MathHelper.toIntegerOrDefault(value);
        if (value < 0) {
            value = ServerSettingsViewModel.formFieldsDefaultValues.MaxUploadSlots;
        }
        this.setField('MaxUploadSlots', value, true);
    }
    get AutoPause() {
        return this._formFields.AutoPause;
    }
    set AutoPause(value) {
        this.setField('AutoPause', value);
    }
    get UseDefaultAdmins() {
        return this._formFields.UseDefaultAdmins;
    }
    set UseDefaultAdmins(value) {
        if (this.setField('UseDefaultAdmins', value)) {
            this.raise('adminsEditEnabled', this.adminsEditEnabled);
        }
    }
    get Admins() {
        return this._formFields.Admins;
    }
    set Admins(value) {
        let trimmedValue = value.trim();
        this.setField('Admins', trimmedValue, true);
    }
    get AutosaveInterval() {
        return this._formFields.AutosaveInterval;
    }
    set AutosaveInterval(value) {
        value = MathHelper.toIntegerOrDefault(value);
        if (value < 1) {
            value = ServerSettingsViewModel.formFieldsDefaultValues.AutosaveInterval;
        }
        this.setField('AutosaveInterval', value, true);
    }
    get AutosaveSlots() {
        return this._formFields.AutosaveSlots;
    }
    set AutosaveSlots(value) {
        value = MathHelper.toIntegerOrDefault(value);
        if (value < 0) {
            value = ServerSettingsViewModel.formFieldsDefaultValues.AutosaveSlots;
        }
        this.setField('AutosaveSlots', value, true);
    }
    get NonBlockingSaving() {
        return this._formFields.NonBlockingSaving;
    }
    set NonBlockingSaving(value) {
        this.setField('NonBlockingSaving', value);
    }
    get PublicVisible() {
        return this._formFields.PublicVisible;
    }
    set PublicVisible(value) {
        this.setField('PublicVisible', value);
    }
    get saved() {
        return this._saved;
    }
    setSaved(value) {
        if (this._saved === value) {
            return;
        }
        this._saved = value;
        this.raise('saved', value);
        this._saveCommand.raiseCanExecuteChanged();
        this._undoCommand.raiseCanExecuteChanged();
    }
    get adminsEditEnabled() {
        return !this._formFields.UseDefaultAdmins;
    }
    get errors() {
        return this._errors;
    }
    get saveCommand() {
        return this._saveCommand;
    }
    get undoCommand() {
        return this._undoCommand;
    }
    get copyCommand() {
        return this._copyCommand;
    }
    get pasteText() {
        return this._pasteText;
    }
    setPasteText(value) {
        if (this._pasteText == value) {
            return;
        }
        this._pasteText = value;
        this.raise('pasteText', value);
    }
    setAndDoValidation(propertyName, value) {
        if (this.setAndRaise(this._formFields, propertyName, value)) {
            let validationResult = this._validator.validate(propertyName);
            this.errors.setError(propertyName, validationResult);
            return true;
        }
        return false;
    }
    update(settings) {
        for (let propertyName in settings) {
            let value = ServerSettingsViewModel.convertToFormField(propertyName, settings[propertyName]);
            if (this.setAndDoValidation(propertyName, value) && propertyName === 'UseDefaultAdmins') {
                this.raise('adminsEditEnabled', this.adminsEditEnabled);
            }
        }
    }
    setField(propertyName, value, forceRaise) {
        if (this.setAndDoValidation(propertyName, value)) {
            this.setSaved(false);
            if (!this._suppressUpdate) {
                let settingValue = ServerSettingsViewModel.convertToFactorioServerSettings(propertyName, value);
                let settings = {};
                settings[propertyName] = settingValue;
                this._serverSettingsService.updateSettings({ Type: CollectionChangeType.Add, NewItems: settings });
            }
            return true;
        }
        if (forceRaise) {
            this.raise(propertyName, value);
        }
        return false;
    }
    static convertToFormField(key, settingValue) {
        switch (key) {
            case 'Tags': {
                let tags = (settingValue !== null && settingValue !== void 0 ? settingValue : []);
                return tags.join('\n');
            }
            case 'Admins': {
                let admins = (settingValue !== null && settingValue !== void 0 ? settingValue : []);
                return admins.map(s => s.trim()).join(', ');
            }
            default: return settingValue !== null && settingValue !== void 0 ? settingValue : ServerSettingsViewModel.formFieldsDefaultValues[key];
        }
    }
    static convertToFactorioServerSettings(key, fieldValue) {
        let value = fieldValue !== null && fieldValue !== void 0 ? fieldValue : ServerSettingsViewModel.formFieldsDefaultValues[key];
        switch (key) {
            case 'Name': return value.trim();
            case 'Description': return value.trim();
            case 'Tags': {
                let tags = value;
                return tags.trim().split('\n');
            }
            case 'Admins': {
                let admins = value;
                let adminsText = admins.trim().split(',');
                for (let i = 0; i < adminsText.length; i++) {
                    adminsText[i] = adminsText[i].trim();
                }
                return adminsText;
            }
            default: return value;
        }
    }
    buildFactorioServerSettings() {
        let settings = {};
        let fields = this._formFields;
        for (let propertyName in fields) {
            let key = propertyName;
            let value = ServerSettingsViewModel.convertToFactorioServerSettings(key, fields[propertyName]);
            settings[propertyName] = value;
        }
        return settings;
    }
    saveSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            let settings = this.buildFactorioServerSettings();
            let result = yield this._serverSettingsService.saveSettings(settings);
            this._errorService.reportIfError(result);
        });
    }
    copySettings() {
        let settings = this.buildFactorioServerSettings();
        let text = JSON.stringify(settings);
        this._copyToClipoardService.copy(text);
    }
    pasteSettingsClicked() {
        this.setPasteText(ServerSettingsViewModel.normalPasteText);
    }
    pasteSettings(text) {
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
            for (let propertyName in settings) {
                if (!fields.hasOwnProperty(propertyName)) {
                    continue;
                }
                let value = ServerSettingsViewModel.convertToFormField(propertyName, settings[propertyName]);
                if (value == null) {
                    continue;
                }
                this[propertyName] = value;
                changeData[propertyName] = ServerSettingsViewModel.convertToFactorioServerSettings(propertyName, this[propertyName]);
            }
            this.setPasteText(ServerSettingsViewModel.appliedPasteText);
            this._serverSettingsService.updateSettings({ Type: CollectionChangeType.Add, NewItems: changeData });
        }
        finally {
            this._suppressUpdate = false;
        }
    }
}
ServerSettingsViewModel.normalPasteText = 'Paste settings here';
ServerSettingsViewModel.errorPasteText = 'Invalid settings';
ServerSettingsViewModel.appliedPasteText = 'Settings applied';
ServerSettingsViewModel.formFieldsDefaultValues = {
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
    PublicVisible: true
};
//# sourceMappingURL=serverSettingsViewModel.js.map