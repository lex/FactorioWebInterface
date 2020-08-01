import { CollectionChangedData, CollectionChangeType } from "../../ts/utils";
import { ObservableObject } from "../../utils/observableObject";
import { ObservableKeyArray, ObservableCollection } from "../../utils/collections/module";
import { Entry, ScenarioData } from "./scenarioData";
import { ScenarioDataHubService } from "./scenarioDataHubService";

export class ScenarioDataService extends ObservableObject {
    private readonly _scenarioDataHubService: ScenarioDataHubService;

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

    constructor(scenarioDataHubService: ScenarioDataHubService) {
        super();

        this._scenarioDataHubService = scenarioDataHubService;

        scenarioDataHubService.onSendDataSets.subscribe((event: CollectionChangedData<string>) => {
            this.setFetchingDataSets(false);
            this._dataSets.update(event);
        });

        scenarioDataHubService.onSendEntries.subscribe((event: { dataSet: string, data: CollectionChangedData }) => {
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

    setCurrentDataSet(dataSet: string) {
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

    update(data: ScenarioData) {
        if (data.Value == null || data.Value === "") {
            delete data.Value;
        }

        this._scenarioDataHubService.updateData(data);
    }
}