import { HubConnection, HubConnectionBuilder, HubConnectionState } from "@microsoft/signalr";
import { Observable, IObservable } from "../../utils/observable";
import { MessagePackHubProtocol } from "@microsoft/signalr-protocol-msgpack";
import { CollectionChangedData, Result } from "../../ts/utils";
import { Ban } from "./ban";

export class BansHubService {
    private _connection: HubConnection;

    private _whenConnection = new Observable<void>();

    private _onSendBans = new Observable<CollectionChangedData<Ban>>();

    get onSendBans(): IObservable<CollectionChangedData<Ban>> {
        return this._onSendBans;
    }

    constructor() {
        this._connection = new HubConnectionBuilder()
            .withUrl("/factorioBanHub")
            .withHubProtocol(new MessagePackHubProtocol())
            .build();

        this._connection.on('SendBans', (data: CollectionChangedData) => {
            this._onSendBans.raise(data);
        });

        this._connection.onclose(async () => {
            await this.startConnection();
        });

        this.startConnection();
    }

    whenConnection(callback: () => void): () => void {
        if (this._connection.state === HubConnectionState.Connected) {
            callback();
        }

        return this._whenConnection.subscribe(callback);
    }

    requestBans(): void {
        this._connection.send('RequestAllBans');
    }

    addBan(ban: Ban, synchronizeWithServers: boolean): Promise<Result> {
        return this._connection.invoke('AddBan', ban, synchronizeWithServers);
    }

    removeBan(username: string, synchronizeWithServers: boolean): Promise<Result> {
        return this._connection.invoke('RemoveBan', username, synchronizeWithServers);
    }

    private async startConnection() {
        try {
            await this._connection.start();

            this._whenConnection.raise();
        } catch (ex) {
            console.log(ex);
            setTimeout(() => this.startConnection(), 2000);
        }
    }
}