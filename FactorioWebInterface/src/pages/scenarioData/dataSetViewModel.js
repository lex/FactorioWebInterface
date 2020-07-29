import { ObservableObject } from "../../utils/observableObject";
import { IterableHelper } from "../../utils/iterableHelper";
import { CollectionView } from "../../utils/collections/module";
import { DelegateCommand } from "../../utils/command";
export class DataSetViewModel extends ObservableObject {
    constructor(scenarioDataService, updateDataViewModel) {
        super();
        this._scenarioDataService = scenarioDataService;
        this._updateDataViewModel = updateDataViewModel;
        this._header = scenarioDataService.currentDataSet;
        this._dataSets = new CollectionView(scenarioDataService.dataSets);
        this._dataSets.selectedChanged.subscribe(() => this.setDataSet());
        scenarioDataService.entries.subscribe(event => {
            if (scenarioDataService.fetchingEntries) {
                this._header = `${scenarioDataService.currentDataSet} (fetching...)`;
            }
            else {
                this._header = `${scenarioDataService.currentDataSet} (${scenarioDataService.entries.count})`;
            }
            this.raise('header', this._header);
        });
        scenarioDataService.bind('fetchingDataSets', value => {
            this.setPlaceholder(value ? DataSetViewModel.fetchingPlaceholder : DataSetViewModel.defaultPlaceholder);
            this.raise('fetchingDataSets', value);
        });
        this._refreshDataSetsCommand = new DelegateCommand(() => this.refreshDataSets());
    }
    get header() {
        return this._header || 'No Data Set selected';
    }
    get placeholder() {
        return this._placeholder;
    }
    get fetchingDataSets() {
        return this._scenarioDataService.fetchingDataSets;
    }
    get dataSets() {
        return this._dataSets;
    }
    get entries() {
        return this._scenarioDataService.entries;
    }
    get refreshDataSetsCommand() {
        return this._refreshDataSetsCommand;
    }
    refreshDataSets() {
        this._scenarioDataService.clearDataSets();
        this._scenarioDataService.requestDataSets();
    }
    updateFormFromEntry(entry) {
        this._updateDataViewModel.DataSet = this._scenarioDataService.currentDataSet;
        this._updateDataViewModel.Key = entry.Key;
        this._updateDataViewModel.Value = entry.Value;
    }
    setPlaceholder(value) {
        if (value === this._placeholder) {
            return;
        }
        this._placeholder = value;
        this.raise('placeholder', value);
    }
    setDataSet() {
        var _a;
        let selectedDataSet = (_a = IterableHelper.firstOrDefault(this._dataSets.selected)) === null || _a === void 0 ? void 0 : _a.value;
        if (selectedDataSet == null) {
            return;
        }
        this._scenarioDataService.setCurrentDataSet(selectedDataSet);
    }
}
DataSetViewModel.defaultPlaceholder = 'Select Data Set';
DataSetViewModel.fetchingPlaceholder = 'Fetching...';
//# sourceMappingURL=dataSetViewModel.js.map