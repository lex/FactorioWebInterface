import { ObservableProperty } from "../../utils/observableProperty";
import { Observable } from "../../utils/observable";
import { CollectionChangeType } from "../../ts/utils";
export class ServerExtraSettingsService {
    constructor(serversHubService, serverIdService) {
        this._saved = new ObservableProperty(true);
        this._settingsObservable = new Observable();
        this._serversHubService = serversHubService;
        serversHubService.onServerExtraSettings.subscribe(event => {
            this._settings = event.settings;
            this._settingsObservable.raise({ Type: CollectionChangeType.Reset, NewItems: event.settings });
            this._saved.raise(event.saved);
        });
        serversHubService.onServerExtraSettingsUpdate.subscribe(event => {
            Object.assign(this._settings, event.data.NewItems);
            this._settingsObservable.raise(event.data);
            if (event.markUnsaved) {
                this._saved.raise(false);
            }
        });
        serversHubService.onConnection.subscribe(() => {
            this._serversHubService.requestServerExtraSettings();
        });
        serverIdService.serverId.subscribe(() => {
            this._serversHubService.requestServerExtraSettings();
        });
    }
    get settings() {
        return this._settings;
    }
    get saved() {
        return this._saved.value;
    }
    get settingsChanged() {
        return this._settingsObservable;
    }
    get savedChanged() {
        return this._saved;
    }
    saveSettings(settings) {
        return this._serversHubService.saveServerExtraSettings(settings);
    }
    updateSettings(data) {
        this._serversHubService.updateServerExtraSettings(data);
    }
    undoSettings() {
        this._serversHubService.undoServerExtraSettings();
    }
}
//# sourceMappingURL=serverExtraSettingsService.js.map