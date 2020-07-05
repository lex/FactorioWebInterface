import { ObservableProperty, IObservableProperty } from "../../utils/observableProperty";
import { ServersHubService } from "./serversHubService";
import { Observable, IObservable } from "../../utils/observable";
import { FactorioControlClientData } from "./serversTypes";
import { IHiddenInputService } from "../../services/iHiddenInputService";
import { ObservableKeyArray, ObservableCollection } from "../../utils/observableCollection";
import { INavigationHistoryService } from "../../services/iNavigationHistoryService";

export class ServerIdService {
    private readonly _serversHubService: ServersHubService;
    private readonly _navigationHistory: INavigationHistoryService;

    private readonly _currentServerId: ObservableProperty<string>;
    private readonly _serverIds: ObservableKeyArray<string, string>;
    private readonly _clientData = new Observable<FactorioControlClientData>();

    get currentServerId(): IObservableProperty<string> {
        return this._currentServerId;
    }

    get currentServerIdValue(): string {
        return this._currentServerId.value;
    }

    get serverIds(): ObservableCollection<string> {
        return this._serverIds;
    }

    get onClientData(): IObservable<FactorioControlClientData> {
        return this._clientData;
    }

    constructor(serversHubService: ServersHubService, hiddenInputService: IHiddenInputService, navigationHistory: INavigationHistoryService) {
        this._serversHubService = serversHubService;
        this._navigationHistory = navigationHistory;

        let selected = hiddenInputService.getValue('serverSelected');
        let count = Number(hiddenInputService.getValue('serverCount'));

        this._currentServerId = new ObservableProperty(selected);
        this._serverIds = new ObservableKeyArray(x => x);
        for (let i = 1; i <= count; i++) {
            this._serverIds.add(i + '');
        }

        navigationHistory.replace(`/admin/servers/${selected}`, selected);

        navigationHistory.onPop.subscribe(event => {
            let value = event.state;

            if (typeof value !== 'string' || value === '' || value === this.currentServerIdValue) {
                return;
            }

            this.updateServerId(value);
            this._currentServerId.raise(value);
        });

        serversHubService.whenConnection(() => {
            this.updateServerId(this.currentServerIdValue);
        });
    }

    setServerId(value: string): Promise<void> {
        if (this.currentServerIdValue === value) {
            return;
        }

        let promise = this.updateServerId(value);

        this._navigationHistory.push(`/admin/servers/${value}`, value);
        this._currentServerId.raise(value);

        return promise
    }

    private async updateServerId(value: string): Promise<void> {
        let data = await this._serversHubService.setServerId(value);
        this._clientData.raise(data);
    }
}