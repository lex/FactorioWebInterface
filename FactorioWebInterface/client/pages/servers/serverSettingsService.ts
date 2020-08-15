import { ServersHubService } from "./serversHubService";
import { FactorioServerSettings } from "./serversTypes";
import { KeyValueCollectionChangedData, CollectionChangeType, Result } from "../../ts/utils";
import { ObservableProperty, IObservableProperty } from "../../utils/observableProperty";
import { ServerIdService } from "./serverIdService";
import { Observable, IObservable } from "../../utils/observable";

export class ServerSettingsService {
    private _serversHubService: ServersHubService;

    private _settings = {} as FactorioServerSettings;
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

        serversHubService.whenConnection(() => {
            this._serversHubService.requestServerSettings();
        });

        serverIdService.currentServerId.subscribe(() => {
            this._serversHubService.requestServerSettings();
        })
    }

    saveSettings(settings: FactorioServerSettings): Promise<Result> {
        return this._serversHubService.saveServerSettings(settings);
    }

    updateSettings(data: KeyValueCollectionChangedData) {
        this._serversHubService.updateServerSettings(data);
    }

    undoSettings() {
        this._serversHubService.undoServerSettings();
    }
}