import { HubConnectionBuilder, HubConnection } from "@microsoft/signalr";
import { MessagePackHubProtocol } from "@microsoft/signalr-protocol-msgpack"
import { Result, CollectionChangedData } from "../../ts/utils";
import { ObservableKeyArray, ObservableCollection } from "../../utils/collections/module";

export interface Admin {
    Name: string;
}

export class AdminsService {
    private _connection: HubConnection;

    private _admins = new ObservableKeyArray<string, Admin>(admin => admin.Name);

    get admins(): ObservableCollection<Admin> {
        return this._admins;
    }

    constructor() {
        this._connection = new HubConnectionBuilder()
            .withUrl("/factorioAdminHub")
            .withHubProtocol(new MessagePackHubProtocol())
            .build();

        this._connection.on('SendAdmins', (data: CollectionChangedData) => {
            this._admins.update(data);
        });

        this._connection.onclose(async () => {
            await this.startConnection();
        });

        this.startConnection();
    }

    requestAdmins() {
        this._connection.send('RequestAdmins');
    }

    async addAdmins(text: string): Promise<string> {
        let data = text.trim();
        if (data === "") {
            return 'Enter names for admins';
        }

        let result = await this._connection.invoke('AddAdmins', data) as Result;

        if (!result.Success) {
            return JSON.stringify(result.Errors);
        }

        return undefined;
    }

    async removeAdmin(admin: Admin): Promise<string> {
        let name = admin.Name;

        let result = await this._connection.invoke('RemoveAdmin', name) as Result;

        if (!result.Success) {
            return JSON.stringify(result.Errors);
        }

        return undefined;
    }

    private async startConnection() {
        try {
            await this._connection.start();
            this.requestAdmins();
        } catch (ex) {
            console.log(ex);
            setTimeout(() => this.startConnection(), 2000);
        }
    }
}