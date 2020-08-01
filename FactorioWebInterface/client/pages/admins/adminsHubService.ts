import { HubConnectionBuilder, HubConnection, HubConnectionState } from "@microsoft/signalr";
import { MessagePackHubProtocol } from "@microsoft/signalr-protocol-msgpack"
import { Result, CollectionChangedData } from "../../ts/utils";
import { Observable, IObservable } from "../../utils/observable";
import { Admin } from "./adminsTypes";

export class AdminsHubService {
    private _connection: HubConnection;

    private _whenConnection = new Observable<void>();

    private _onSendAdmins = new Observable<CollectionChangedData<Admin>>();

    get onSendAdmins(): IObservable<CollectionChangedData<Admin>> {
        return this._onSendAdmins;
    }

    constructor() {
        this._connection = new HubConnectionBuilder()
            .withUrl("/factorioAdminHub")
            .withHubProtocol(new MessagePackHubProtocol())
            .build();

        this._connection.on('SendAdmins', (data: CollectionChangedData<Admin>) => {
            this._onSendAdmins.raise(data);
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

    requestAdmins(): void {
        this._connection.send('RequestAdmins');
    }

    addAdmins(data: string): Promise<Result> {
        return this._connection.invoke('AddAdmins', data);
    }

    removeAdmin(name: string): Promise<Result> {
        return this._connection.invoke('RemoveAdmin', name);
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