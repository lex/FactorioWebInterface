import { HubConnectionBuilder, HubConnection } from "@microsoft/signalr";
import { MessagePackHubProtocol } from "@microsoft/signalr-protocol-msgpack";
import { Result, CollectionChangedData } from "../../ts/utils";
import { ObservableCollection, ObservableKeyArray } from "../../utils/collections/module";

export interface Ban {
    Username: string;
    Reason: string;
    Admin: string;
    DateTime: Date;
}

export class BansService {
    private _connection: HubConnection;

    private _bans = new ObservableKeyArray<string, Ban>(ban => ban.Username);

    get bans(): ObservableCollection<Ban> {
        return this._bans;
    }

    constructor() {
        this._connection = new HubConnectionBuilder()
            .withUrl("/factorioBanHub")
            .withHubProtocol(new MessagePackHubProtocol())
            .build();

        this._connection.on('SendBans', (data: CollectionChangedData) => {
            this._bans.update(data);
        });

        this._connection.onclose(async () => {
            await this.startConnection();
        });

        this.startConnection();
    }

    requestBans() {
        this._connection.send('RequestAllBans');
    }

    async addBan(ban: Ban, synchronizeWithServers: boolean): Promise<string> {
        let result = await this._connection.invoke('AddBan', ban, synchronizeWithServers) as Result;
        if (!result.Success) {
            return JSON.stringify(result.Errors);
        }

        return undefined;
    }

    async removeBan(username: string, synchronizeWithServers: boolean): Promise<string> {
        let result = await this._connection.invoke('RemoveBan', username, synchronizeWithServers) as Result;

        if (!result.Success) {
            return JSON.stringify(result.Errors);
        }

        return undefined
    }

    private async startConnection() {
        try {
            await this._connection.start();
            this.requestBans();
        } catch (ex) {
            console.log(ex);
            setTimeout(() => this.startConnection(), 2000);
        }
    }
}