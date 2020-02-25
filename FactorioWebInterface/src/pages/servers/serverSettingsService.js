import { CollectionChangeType } from "../../ts/utils";
import { ObservableProperty } from "../../utils/observableProperty";
import { Observable } from "../../utils/observable";
export class ServerSettingsService {
    constructor(serversHubService, serverIdService) {
        this._saved = new ObservableProperty(true);
        this._settingsObservable = new Observable();
        this._serversHubService = serversHubService;
        serversHubService.onServerSettings.subscribe(event => {
            this._settings = event.settings;
            this._settingsObservable.raise({ Type: CollectionChangeType.Reset, NewItems: event.settings });
            this._saved.raise(event.saved);
        });
        serversHubService.onServerSettingsUpdate.subscribe(event => {
            Object.assign(this._settings, event.data.NewItems);
            this._settingsObservable.raise(event.data);
            if (event.markUnsaved) {
                this._saved.raise(false);
            }
        });
        serversHubService.onConnection.subscribe(() => {
            this._serversHubService.requestServerSettings();
        });
        serverIdService.serverId.subscribe(() => {
            this._serversHubService.requestServerSettings();
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
        return this._serversHubService.saveServerSettings(settings);
    }
    updateSettings(data) {
        this._serversHubService.updateServerSettings(data);
    }
    undoSettings() {
        this._serversHubService.undoServerSettings();
    }
}
//# sourceMappingURL=serverSettingsService.js.map