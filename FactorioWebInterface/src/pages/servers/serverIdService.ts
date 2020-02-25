import { ObservableProperty, IObservableProperty } from "../../utils/observableProperty";
import { ServersHubService } from "./serversHubService";
import { Observable, IObservable } from "../../utils/observable";
import { FactorioControlClientData } from "./serversTypes";

export class ServerIdService {
    private _serversHubService: ServersHubService;

    private _serverId = new ObservableProperty('1');
    private _clientData = new Observable<FactorioControlClientData>();

    get serverId(): IObservableProperty<string> {
        return this._serverId;
    }

    get currentServerId(): string {
        return this._serverId.value;
    }

    get onClientData(): IObservable<FactorioControlClientData> {
        return this._clientData;
    }

    constructor(serversHubService: ServersHubService) {
        this._serversHubService = serversHubService;

        serversHubService.onConnection.subscribe(() => {
            this._serversHubService.setServerId(this.currentServerId);
        });
    }

    async setServerId(value: string): Promise<void> {
        if (this.currentServerId === value) {
            return;
        }

        let data = await this._serversHubService.setServerId(value);
        this._serverId.raise(value);
        this._clientData.raise(data);
    }
}