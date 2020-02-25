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
import { DelegateCommand } from "../../utils/command";
import { ServerSettingsViewModel } from "./serverSettingsViewModel";
import { CollectionChangeType, Utils } from "../../ts/utils";
export class ServerExtraSettingsViewModel extends ObservableObject {
    constructor(serverExtraSettingsService, copyToClipoardService, errorService) {
        super();
        this._suppressUpdate = false;
        this._formFields = Object.assign({}, ServerExtraSettingsViewModel.formFieldsDefaultValues);
        this._pasteText = ServerSettingsViewModel.normalPasteText;
        this._serverExtraSettingsService = serverExtraSettingsService;
        this._copyToClipoardService = copyToClipoardService;
        this._errorService = errorService;
        this.update(serverExtraSettingsService.settings);
        serverExtraSettingsService.settingsChanged.subscribe(event => this.update(event.NewItems));
        this._saved = serverExtraSettingsService.saved;
        serverExtraSettingsService.savedChanged.subscribe(event => this.setSaved(event));
        this._saveCommand = new DelegateCommand(() => this.saveSettings(), () => !this.saved);
        this._undoCommand = new DelegateCommand(() => this._serverExtraSettingsService.undoSettings(), () => !this.saved);
        this._copyCommand = new DelegateCommand(() => this.copySettings());
    }
    get SyncBans() {
        return this._formFields.SyncBans;
    }
    set SyncBans(value) {
        this.set('SyncBans', value);
    }
    get BuildBansFromDatabaseOnStart() {
        return this._formFields.BuildBansFromDatabaseOnStart;
    }
    set BuildBansFromDatabaseOnStart(value) {
        this.set('BuildBansFromDatabaseOnStart', value);
    }
    get SetDiscordChannelName() {
        return this._formFields.SetDiscordChannelName;
    }
    set SetDiscordChannelName(value) {
        this.set('SetDiscordChannelName', value);
    }
    get GameChatToDiscord() {
        return this._formFields.GameChatToDiscord;
    }
    set GameChatToDiscord(value) {
        this.set('GameChatToDiscord', value);
    }
    get GameShoutToDiscord() {
        return this._formFields.GameShoutToDiscord;
    }
    set GameShoutToDiscord(value) {
        this.set('GameShoutToDiscord', value);
    }
    get DiscordToGameChat() {
        return this._formFields.DiscordToGameChat;
    }
    set DiscordToGameChat(value) {
        this.set('DiscordToGameChat', value);
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
    update(settings) {
        for (let propertyName in settings) {
            let value = ServerExtraSettingsViewModel.getOrDefault(propertyName, settings[propertyName]);
            this.setAndRaise(this._formFields, propertyName, value);
        }
    }
    set(propertyName, value) {
        if (this.setAndRaise(this._formFields, propertyName, value)) {
            this.setSaved(false);
            if (!this._suppressUpdate) {
                let settingValue = ServerExtraSettingsViewModel.getOrDefault(propertyName, value);
                let settings = {};
                settings[propertyName] = settingValue;
                this._serverExtraSettingsService.updateSettings({ Type: CollectionChangeType.Add, NewItems: settings });
            }
        }
    }
    buildFactorioServerSettings() {
        let settings = {};
        let fields = this._formFields;
        for (let propertyName in fields) {
            let key = propertyName;
            let value = ServerExtraSettingsViewModel.getOrDefault(key, fields[propertyName]);
            settings[propertyName] = value;
        }
        return settings;
    }
    saveSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            let settings = this.buildFactorioServerSettings();
            let result = yield this._serverExtraSettingsService.saveSettings(settings);
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
                let value = ServerExtraSettingsViewModel.getOrDefault(propertyName, settings[propertyName]);
                if (value == null) {
                    continue;
                }
                this[propertyName] = value;
                changeData[propertyName] = value;
            }
            this.setPasteText(ServerSettingsViewModel.appliedPasteText);
            this._serverExtraSettingsService.updateSettings({ Type: CollectionChangeType.Add, NewItems: changeData });
        }
        finally {
            this._suppressUpdate = false;
        }
    }
    static getOrDefault(key, fieldValue) {
        return fieldValue !== null && fieldValue !== void 0 ? fieldValue : ServerExtraSettingsViewModel.formFieldsDefaultValues[key];
    }
}
ServerExtraSettingsViewModel.formFieldsDefaultValues = {
    SyncBans: true,
    BuildBansFromDatabaseOnStart: true,
    SetDiscordChannelName: true,
    GameChatToDiscord: true,
    GameShoutToDiscord: true,
    DiscordToGameChat: true,
};
//# sourceMappingURL=serverExtraSettingsViewModel.js.map