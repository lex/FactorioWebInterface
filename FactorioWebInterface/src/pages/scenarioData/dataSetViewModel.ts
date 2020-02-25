import { ScenarioDataService, Entry } from "./scenarioDataService";
import { ObservableCollection, ObservableArray } from "../../utils/observableCollection";
import { ObservableObject } from "../../utils/observableObject";
import { UpdateDataViewModel } from "./updateDataViewModel";
import { CollectionChangeType } from "../../ts/utils";
import { DataSetOption } from "./dataSetOption";

export class DataSetViewModel extends ObservableObject {
    private static placeHolderOption = new DataSetOption('Select Data Set');
    private static fetchingOption = new DataSetOption('Fetching...');

    private _scenarioDataService: ScenarioDataService;
    private _updateDataViewModel: UpdateDataViewModel;

    private _header: string;
    private _dataSetOptions: ObservableArray<DataSetOption>;

    get header(): string {
        return this._header || 'No Data Set selected';
    }

    get dataSetsOptions(): ObservableCollection<DataSetOption> {
        return this._dataSetOptions;
    }

    get entries(): ObservableCollection<Entry> {
        return this._scenarioDataService.entries;
    }

    constructor(scenarioDataService: ScenarioDataService, updateDataViewModel: UpdateDataViewModel) {
        super();

        this._scenarioDataService = scenarioDataService;
        this._updateDataViewModel = updateDataViewModel;
        this._header = scenarioDataService.currentDataSet;

        this._dataSetOptions = new ObservableArray();

        scenarioDataService.dataSets.subscribe(event => {
            this.buildDataSetOptions();
        });
        this.buildDataSetOptions();

        scenarioDataService.entries.subscribe(event => {
            if (scenarioDataService.fetchingEntries) {
                this._header = `${scenarioDataService.currentDataSet} (fetching...)`;
            } else {
                this._header = `${scenarioDataService.currentDataSet} (${scenarioDataService.entries.count})`;
            }

            this.raise('header', this._header);
        });

        scenarioDataService.propertyChanged('fetchingDataSets', value => {
            if (value) {
                this.setFetchingDataSetOptions();
            }
        });
        if (scenarioDataService.fetchingDataSets) {
            this.setFetchingDataSetOptions();
        }
    }

    setDataSet(dataSetOption: DataSetOption) {
        if (dataSetOption === DataSetViewModel.placeHolderOption || dataSetOption === DataSetViewModel.fetchingOption) {
            return;
        }

        this._dataSetOptions.update({ Type: CollectionChangeType.Remove, OldItems: [DataSetViewModel.placeHolderOption] })

        this._scenarioDataService.setCurrentDataSet(dataSetOption.value);
    }

    refreshDataSets() {
        this._dataSetOptions.update({ Type: CollectionChangeType.Reset, NewItems: [DataSetViewModel.fetchingOption] });
        this._scenarioDataService.requestDataSets();
    }

    updateFormFromEntry(entry: Entry) {
        this._updateDataViewModel.DataSet = this._scenarioDataService.currentDataSet;
        this._updateDataViewModel.Key = entry.Key;
        this._updateDataViewModel.Value = entry.Value;
    }

    private buildDataSetOptions() {
        let newOptions = [DataSetViewModel.placeHolderOption];

        for (let dataSet of this._scenarioDataService.dataSets.values()) {
            newOptions.push(new DataSetOption(dataSet));
        }

        this._dataSetOptions.update({ Type: CollectionChangeType.Reset, NewItems: newOptions });
    }

    private setFetchingDataSetOptions() {
        this._dataSetOptions.update({ Type: CollectionChangeType.Reset, NewItems: [DataSetViewModel.fetchingOption] });
    }
}