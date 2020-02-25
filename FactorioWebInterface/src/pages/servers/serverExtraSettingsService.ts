import { ServersHubService } from "./serversHubService";
import { FactorioServerExtraSettings } from "./serversTypes";
import { ObservableProperty, IObservableProperty } from "../../utils/observableProperty";
import { Observable, IObservable } from "../../utils/observable";
import { KeyValueCollectionChangedData, CollectionChangeType, Result } from "../../ts/utils";
import { ServerIdService } from "./serverIdService";

export class ServerExtraSettingsService {
    private _serversHubService: ServersHubService;

    private _settings: FactorioServerExtraSettings;
    private _saved = new ObservableProperty<boolean>(true);
    private _settingsObservable = new Observable<KeyValueCollectionChangedData>();

    get settings() {
        return this._settings;
    }

    get saved(): boolean {
        return this._saved.value;
    }

    get settingsChanged(): IObservable<KeyValueCollectionChangedData> {
        return this._settingsObservable;
    }

    get savedChanged(): IObservableProperty<boolean> {
        return this._saved;
    }

    constructor(serversHubService: ServersHubService, serverIdService: ServerIdService) {
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
        })
    }

    saveSettings(settings: FactorioServerExtraSettings): Promise<Result> {
        return this._serversHubService.saveServerExtraSettings(settings);
    }

    updateSettings(data: KeyValueCollectionChangedData) {
        this._serversHubService.updateServerExtraSettings(data);
    }

    undoSettings() {
        this._serversHubService.undoServerExtraSettings();
    }
}