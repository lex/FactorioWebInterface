var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { HubConnectionBuilder } from "@microsoft/signalr";
import { MessagePackHubProtocol } from "@microsoft/signalr-protocol-msgpack";
import { CollectionChangeType } from "../../ts/utils";
import { ObservableObject } from "../../utils/observableObject";
import { ObservableKeyArray } from "../../utils/collections/module";
export class ScenarioDataService extends ObservableObject {
    constructor() {
        super();
        this._currentDataSet = undefined;
        this._dataSets = new ObservableKeyArray(dataSet => dataSet);
        this._entries = new ObservableKeyArray(entry => entry.Key);
        this._fetchingDataSets = false;
        this._fetchingEntries = false;
        this._connection = new HubConnectionBuilder()
            .withUrl("/scenarioDataHub")
            .withHubProtocol(new MessagePackHubProtocol())
            .build();
        this._connection.on('SendDataSets', (dataSets) => {
            this.setFetchingDataSets(false);
            this._dataSets.update({ Type: CollectionChangeType.Reset, NewItems: dataSets });
        });
        this._connection.on('SendEntries', (dataSet, data) => {
            if (this._currentDataSet !== dataSet) {
                return;
            }
            this.setFetchingEntries(false);
            this._entries.update(data);
        });
        this._connection.onclose(() => __awaiter(this, void 0, void 0, function* () {
            yield this.startConnection();
        }));
        this.startConnection();
    }
    get currentDataSet() {
        return this._currentDataSet;
    }
    set currentDataSet(value) {
        if (value === this._currentDataSet) {
            return;
        }
        this._currentDataSet = value;
        this.raise('currentDataSet', value);
    }
    get dataSets() {
        return this._dataSets;
    }
    get entries() {
        return this._entries;
    }
    get fetchingDataSets() {
        return this._fetchingDataSets;
    }
    setFetchingDataSets(value) {
        if (value === this._fetchingDataSets) {
            return;
        }
        this._fetchingDataSets = value;
        this.raise('fetchingDataSets', value);
    }
    get fetchingEntries() {
        return this._fetchingEntries;
    }
    setFetchingEntries(value) {
        if (value === this._fetchingEntries) {
            return;
        }
        this._fetchingEntries = value;
        this.raise('setFetchingEntries', value);
    }
    setCurrentDataSet(dataSet) {
        if (dataSet === this.currentDataSet) {
            return;
        }
        this._connection.send('TrackDataSet', dataSet);
        this._connection.send('RequestAllDataForDataSet', dataSet);
        this.currentDataSet = dataSet;
        this.setFetchingEntries(true);
        this._entries.update({ Type: CollectionChangeType.Reset, NewItems: [] });
    }
    clearDataSets() {
        this._dataSets.reset();
    }
    requestDataSets() {
        this._connection.send('RequestAllDataSets');
        this.setFetchingDataSets(true);
    }
    update(data) {
        if (data.Value == null || data.Value === "") {
            delete data.Value;
        }
        this._connection.send('UpdateData', data);
    }
    startConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this._connection.start();
                this.requestDataSets();
                if (this.currentDataSet != null) {
                    this._connection.send('TrackDataSet', this.currentDataSet);
                    this._connection.send('RequestAllDataForDataSet', this.currentDataSet);
                }
            }
            catch (ex) {
                console.log(ex);
                setTimeout(() => this.startConnection(), 2000);
            }
        });
    }
}
//# sourceMappingURL=scenarioDataService.js.map