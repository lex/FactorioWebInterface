import * as signalR from "@microsoft/signalr";
import { MessagePackHubProtocol } from "@microsoft/signalr-protocol-msgpack"
import { Observable, IObservable } from "../../utils/observable";
import { Result, CollectionChangedData } from "../../ts/utils";
import { ModPackMetaData, ModPackFileMetaData } from "../servers/serversTypes";

export class ModsHubService {
    private _connection: signalR.HubConnection;

    private _whenConnection = new Observable<void>();

    private _onSendModPacks = new Observable<CollectionChangedData<ModPackMetaData>>();
    private _onSendModPackFiles = new Observable<{ modPack: string, data: CollectionChangedData<ModPackFileMetaData> }>();
    private _onEndDownloadFromModPortal = new Observable<Result>();

    get onSendModPacks(): IObservable<CollectionChangedData<ModPackMetaData>> {
        return this._onSendModPacks;
    }

    get onSendModPackFiles(): IObservable<{ modPack: string, data: CollectionChangedData<ModPackFileMetaData> }> {
        return this._onSendModPackFiles;
    }

    get onEndDownloadFromModPortal(): IObservable<Result> {
        return this._onEndDownloadFromModPortal;
    }

    constructor() {
        this._connection = new signalR.HubConnectionBuilder()
            .withUrl('/factorioModHub')
            .withHubProtocol(new MessagePackHubProtocol())
            .build();

        this._connection.on('SendModPacks', (data: CollectionChangedData<ModPackMetaData>) => {
            this._onSendModPacks.raise(data);
        });

        this._connection.on('SendModPackFiles', (modPack: string, data: CollectionChangedData<ModPackFileMetaData>) => {
            this._onSendModPackFiles.raise({ modPack, data });
        });

        this._connection.on('EndDownloadFromModPortal', (result: Result) => {
            this._onEndDownloadFromModPortal.raise(result);
        });

        this._connection.onclose(async () => {
            await this.startConnection();
        });

        this.startConnection();
    }

    whenConnection(callback: () => void): () => void {
        if (this._connection.state === signalR.HubConnectionState.Connected) {
            callback();
        }

        return this._whenConnection.subscribe(callback);
    }

    requestModPacks() {
        this._connection.send('RequestModPacks');
    }

    requestModPackFiles(modPack: string) {
        this._connection.send('RequestModPackFiles', modPack);
    }

    deleteModPack(modPack: string): Promise<Result> {
        return this._connection.invoke('DeleteModPack', modPack);
    }

    deleteModPackFiles(modPack: string, fileNames: string[]): Promise<Result> {
        return this._connection.invoke('DeleteModPackFiles', modPack, fileNames);
    }

    createModPack(name: string): Promise<Result> {
        return this._connection.invoke('CreateModPack', name);
    }

    renameModPack(oldName: string, newName: string): Promise<Result> {
        return this._connection.invoke('RenameModPack', oldName, newName);
    }

    copyModPackFiles(modPack: string, targetModPack: string, fileNames: string[]): Promise<Result> {
        return this._connection.invoke('CopyModPackFiles', modPack, targetModPack, fileNames);
    }

    moveModPackFiles(modPack: string, targetModPack: string, fileNames: string[]): Promise<Result> {
        return this._connection.invoke('MoveModPackFiles', modPack, targetModPack, fileNames);
    }

    downloadFromModPortal(modPack: string, fileNames: string[]) {
        this._connection.send('DownloadFromModPortal', modPack, fileNames);
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