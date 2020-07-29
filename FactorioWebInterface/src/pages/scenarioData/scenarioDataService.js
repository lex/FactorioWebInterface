import { CollectionChangeType } from "../../ts/utils";
import { ObservableObject } from "../../utils/observableObject";
import { ObservableKeyArray } from "../../utils/collections/module";
export class ScenarioDataService extends ObservableObject {
    constructor(scenarioDataHubService) {
        super();
        this._currentDataSet = undefined;
        this._dataSets = new ObservableKeyArray(dataSet => dataSet);
        this._entries = new ObservableKeyArray(entry => entry.Key);
        this._fetchingDataSets = false;
        this._fetchingEntries = false;
        this._scenarioDataHubService = scenarioDataHubService;
        scenarioDataHubService.onSendDataSets.subscribe((event) => {
            this.setFetchingDataSets(false);
            this._dataSets.update(event);
        });
        scenarioDataHubService.onSendEntries.subscribe((event) => {
            if (this._currentDataSet !== event.dataSet) {
                return;
            }
            this.setFetchingEntries(false);
            this._entries.update(event.data);
        });
        scenarioDataHubService.whenConnection(() => {
            this.requestDataSets();
            if (this.currentDataSet != null) {
                this._scenarioDataHubService.trackDataSet(this.currentDataSet);
                this._scenarioDataHubService.requestAllDataForDataSet(this.currentDataSet);
            }
        });
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
        this._scenarioDataHubService.trackDataSet(dataSet);
        this._scenarioDataHubService.requestAllDataForDataSet(dataSet);
        this.currentDataSet = dataSet;
        this.setFetchingEntries(true);
        this._entries.update({ Type: CollectionChangeType.Reset, NewItems: [] });
    }
    clearDataSets() {
        this._dataSets.reset();
    }
    requestDataSets() {
        this._scenarioDataHubService.requestAllDataSets();
        this.setFetchingDataSets(true);
    }
    update(data) {
        if (data.Value == null || data.Value === "") {
            delete data.Value;
        }
        this._scenarioDataHubService.updateData(data);
    }
}
//# sourceMappingURL=scenarioDataService.js.map