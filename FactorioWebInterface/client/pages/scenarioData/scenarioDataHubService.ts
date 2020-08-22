import { Observable, IObservable } from "../../utils/observable";
import { HubConnection, HubConnectionBuilder, HubConnectionState } from "@microsoft/signalr";
import { MessagePackHubProtocol } from "@microsoft/signalr-protocol-msgpack";
import { CollectionChangedData, CollectionChangeType } from "../../ts/utils";
import { Entry, ScenarioData } from "./scenarioData";

export class ScenarioDataHubService {
    private _connection: HubConnection;

    private _whenConnection = new Observable<void>();

    private _onSendDataSets = new Observable<CollectionChangedData<string>>();
    private _onSendEntries = new Observable<{ dataSet: string, data: CollectionChangedData<Entry> }>();

    get onSendDataSets(): IObservable<CollectionChangedData<string>> {
        return this._onSendDataSets;
    }

    get onSendEntries(): IObservable<{ dataSet: string, data: CollectionChangedData<Entry> }> {
        return this._onSendEntries;
    }

    constructor() {
        this._connection = new HubConnectionBuilder()
            .withUrl("/scenarioDataHub")
            .withHubProtocol(new MessagePackHubProtocol())
            .build();

        this._connection.on('SendDataSets', (dataSets: string[]) => {
            this._onSendDataSets.raise({ Type: CollectionChangeType.Reset, NewItems: dataSets });
        });

        this._connection.on('SendEntries', (dataSet: string, data: CollectionChangedData) => {
            this._onSendEntries.raise({ dataSet, data });
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

    trackDataSet(dataSet: string): void {
        this._connection.send('TrackDataSet', dataSet);
    }

    requestAllDataForDataSet(dataSet: string): void {
        this._connection.send('RequestAllDataForDataSet', dataSet);
    }

    requestAllDataSets(): void {
        this._connection.send('RequestAllDataSets');
    }

    updateData(data: ScenarioData): void {
        this._connection.send('UpdateData', data);
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