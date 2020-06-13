import * as signalR from "@microsoft/signalr";
import { MessagePackHubProtocol } from "@microsoft/signalr-protocol-msgpack"
import { ObservableKeyArray, ObservableCollection } from "../../utils/observableCollection";
import { CollectionChangedData, CollectionChangeType } from "../../ts/utils";
import { ObservableObject } from "../../utils/observableObject";

export interface ScenarioData {
    DataSet: string;
    Key: string;
    Value?: string;
}

export interface Entry {
    Key: string;
    Value: string;
}

export class ScenarioDataService extends ObservableObject {
    private _connection: signalR.HubConnection;

    private _currentDataSet: string = undefined;
    private _dataSets = new ObservableKeyArray<string, string>(dataSet => dataSet);
    private _entries = new ObservableKeyArray<string, Entry>(entry => entry.Key);

    private _fetchingDataSets = false;
    private _fetchingEntries = false;

    get currentDataSet(): string {
        return this._currentDataSet;
    }
    set currentDataSet(value: string) {
        if (value === this._currentDataSet) {
            return;
        }

        this._currentDataSet = value;
        this.raise('currentDataSet', value);
    }

    get dataSets(): ObservableCollection<string> {
        return this._dataSets;
    }

    get entries(): ObservableCollection<Entry> {
        return this._entries;
    }

    get fetchingDataSets(): boolean {
        return this._fetchingDataSets;
    }
    private setFetchingDataSets(value: boolean) {
        if (value === this._fetchingDataSets) {
            return;
        }

        this._fetchingDataSets = value;
        this.raise('fetchingDataSets', value);
    }

    get fetchingEntries(): boolean {
        return this._fetchingEntries;
    }
    private setFetchingEntries(value: boolean) {
        if (value === this._fetchingEntries) {
            return;
        }

        this._fetchingEntries = value;
        this.raise('setFetchingEntries', value);
    }

    constructor() {
        super();

        this._connection = new signalR.HubConnectionBuilder()
            .withUrl("/scenarioDataHub")
            .withHubProtocol(new MessagePackHubProtocol())
            .build();

        this._connection.on('SendDataSets', (dataSets: string[]) => {
            this.setFetchingDataSets(false);
            this._dataSets.update({ Type: CollectionChangeType.Reset, NewItems: dataSets });
        });

        this._connection.on('SendEntries', (dataSet: string, data: CollectionChangedData) => {
            if (this._currentDataSet !== dataSet) {
                return;
            }

            this.setFetchingEntries(false);
            this._entries.update(data);
        });

        this._connection.onclose(async () => {
            await this.startConnection();
        });

        this.startConnection();
    }

    setCurrentDataSet(dataSet: string) {
        if (dataSet === this.currentDataSet) {
            return;
        }

        this._connection.send('TrackDataSet', dataSet);
        this._connection.send('RequestAllDataForDataSet', dataSet);

        this.currentDataSet = dataSet;
        this.setFetchingEntries(true);
        this._entries.update({ Type: CollectionChangeType.Reset, NewItems: [] });
    }

    requestDataSets() {
        this._connection.send('RequestAllDataSets');
        this.setFetchingDataSets(true);
    }

    update(data: ScenarioData) {
        if (data.Value == null || data.Value === "") {
            delete data.Value;
        }

        this._connection.send('UpdateData', data);
    }

    private async startConnection() {
        try {
            await this._connection.start();

            this.requestDataSets();
            if (this.currentDataSet != null) {
                this._connection.send('TrackDataSet', this.currentDataSet);
                this._connection.send('RequestAllDataForDataSet', this.currentDataSet);
            }
        } catch (ex) {
            console.log(ex);
            setTimeout(() => this.startConnection(), 2000);
        }
    }
}