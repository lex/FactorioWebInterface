var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Observable } from "../../utils/observable";
import { HubConnectionBuilder, HubConnectionState } from "@microsoft/signalr";
import { MessagePackHubProtocol } from "@microsoft/signalr-protocol-msgpack";
import { CollectionChangeType } from "../../ts/utils";
export class ScenarioDataHubService {
    constructor() {
        this._whenConnection = new Observable();
        this._onSendDataSets = new Observable();
        this._onSendEntries = new Observable();
        this._connection = new HubConnectionBuilder()
            .withUrl("/scenarioDataHub")
            .withHubProtocol(new MessagePackHubProtocol())
            .build();
        this._connection.on('SendDataSets', (dataSets) => {
            this._onSendDataSets.raise({ Type: CollectionChangeType.Reset, NewItems: dataSets });
        });
        this._connection.on('SendEntries', (dataSet, data) => {
            this._onSendEntries.raise({ dataSet, data });
        });
        this._connection.onclose(() => __awaiter(this, void 0, void 0, function* () {
            yield this.startConnection();
        }));
        this.startConnection();
    }
    get onSendDataSets() {
        return this._onSendDataSets;
    }
    get onSendEntries() {
        return this._onSendEntries;
    }
    whenConnection(callback) {
        if (this._connection.state === HubConnectionState.Connected) {
            callback();
        }
        return this._whenConnection.subscribe(callback);
    }
    trackDataSet(dataSet) {
        this._connection.send('TrackDataSet', dataSet);
    }
    requestAllDataForDataSet(dataSet) {
        this._connection.send('RequestAllDataForDataSet', dataSet);
    }
    requestAllDataSets() {
        this._connection.send('RequestAllDataSets');
    }
    updateData(data) {
        this._connection.send('UpdateData', data);
    }
    startConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this._connection.start();
                this._whenConnection.raise();
            }
            catch (ex) {
                console.log(ex);
                setTimeout(() => this.startConnection(), 2000);
            }
        });
    }
}
//# sourceMappingURL=scenarioDataHubService.js.map