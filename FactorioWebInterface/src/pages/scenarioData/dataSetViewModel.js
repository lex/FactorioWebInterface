import { ObservableArray } from "../../utils/observableCollection";
import { ObservableObject } from "../../utils/observableObject";
import { CollectionChangeType } from "../../ts/utils";
import { DataSetOption } from "./dataSetOption";
export class DataSetViewModel extends ObservableObject {
    constructor(scenarioDataService, updateDataViewModel) {
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
            }
            else {
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
    get header() {
        return this._header || 'No Data Set selected';
    }
    get dataSetsOptions() {
        return this._dataSetOptions;
    }
    get entries() {
        return this._scenarioDataService.entries;
    }
    setDataSet(dataSetOption) {
        if (dataSetOption === DataSetViewModel.placeHolderOption || dataSetOption === DataSetViewModel.fetchingOption) {
            return;
        }
        this._dataSetOptions.update({ Type: CollectionChangeType.Remove, OldItems: [DataSetViewModel.placeHolderOption] });
        this._scenarioDataService.setCurrentDataSet(dataSetOption.value);
    }
    refreshDataSets() {
        this._dataSetOptions.update({ Type: CollectionChangeType.Reset, NewItems: [DataSetViewModel.fetchingOption] });
        this._scenarioDataService.requestDataSets();
    }
    updateFormFromEntry(entry) {
        this._updateDataViewModel.DataSet = this._scenarioDataService.currentDataSet;
        this._updateDataViewModel.Key = entry.Key;
        this._updateDataViewModel.Value = entry.Value;
    }
    buildDataSetOptions() {
        let newOptions = [DataSetViewModel.placeHolderOption];
        for (let dataSet of this._scenarioDataService.dataSets.values()) {
            newOptions.push(new DataSetOption(dataSet));
        }
        this._dataSetOptions.update({ Type: CollectionChangeType.Reset, NewItems: newOptions });
    }
    setFetchingDataSetOptions() {
        this._dataSetOptions.update({ Type: CollectionChangeType.Reset, NewItems: [DataSetViewModel.fetchingOption] });
    }
}
DataSetViewModel.placeHolderOption = new DataSetOption('Select Data Set');
DataSetViewModel.fetchingOption = new DataSetOption('Fetching...');
//# sourceMappingURL=dataSetViewModel.js.map