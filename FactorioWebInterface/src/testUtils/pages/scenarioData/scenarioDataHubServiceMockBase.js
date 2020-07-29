import { InvokeBase } from "../../invokeBase";
import { Observable } from "../../../utils/observable";
export class ScenarioDataHubServiceMockBase extends InvokeBase {
    constructor() {
        super(...arguments);
        this._onConnection = new Observable();
        this._onSendDataSets = new Observable();
        this._onSendEntries = new Observable();
    }
    get onSendDataSets() {
        this.invoked('onSendDataSets');
        return this._onSendDataSets;
    }
    get onSendEntries() {
        this.invoked('onSendEntries');
        return this._onSendEntries;
    }
    whenConnection(callback) {
        this.invoked('whenConnection', callback);
        return this._onConnection.subscribe(callback);
    }
    trackDataSet(dataSet) {
        this.invoked('trackDataSet', dataSet);
    }
    requestAllDataForDataSet(dataSet) {
        this.invoked('requestAllDataForDataSet', dataSet);
    }
    requestAllDataSets() {
        this.invoked('requestAllDataSets');
    }
    updateData(data) {
        this.invoked('updateData', data);
    }
}
//# sourceMappingURL=scenarioDataHubServiceMockBase.js.map