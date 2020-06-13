import { ScenarioDataService, Entry } from "./scenarioDataService";
import { ObservableCollection, ObservableArray } from "../../utils/observableCollection";
import { ObservableObject } from "../../utils/observableObject";
import { UpdateDataViewModel } from "./updateDataViewModel";
import { CollectionChangeType } from "../../ts/utils";
import { DataSetOption } from "./dataSetOption";
import { CollectionView } from "../../utils/collectionView";
import { IterableHelper } from "../../utils/iterableHelper";

export class DataSetViewModel extends ObservableObject {
    private static placeHolderOption = new DataSetOption('Select Data Set');
    private static fetchingOption = new DataSetOption('Fetching...');

    private _scenarioDataService: ScenarioDataService;
    private _updateDataViewModel: UpdateDataViewModel;

    private _header: string;
    private _dataSetOptions: ObservableArray<DataSetOption>;
    private _dataSetOptionsView: CollectionView<DataSetOption>;

    get header(): string {
        return this._header || 'No Data Set selected';
    }

    get dataSetsOptions(): CollectionView<DataSetOption> {
        return this._dataSetOptionsView;
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
        this._dataSetOptionsView = new CollectionView(this._dataSetOptions);
        this._dataSetOptionsView.selectedChanged.subscribe(() => this.setDataSet())

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

    refreshDataSets() {
        this._dataSetOptions.update({ Type: CollectionChangeType.Reset, NewItems: [DataSetViewModel.fetchingOption] });
        this._scenarioDataService.requestDataSets();
    }

    updateFormFromEntry(entry: Entry) {
        this._updateDataViewModel.DataSet = this._scenarioDataService.currentDataSet;
        this._updateDataViewModel.Key = entry.Key;
        this._updateDataViewModel.Value = entry.Value;
    }

    private setDataSet() {
        let dataSetOption: DataSetOption = IterableHelper.firstOrDefault(this._dataSetOptionsView.selected)?.value;

        if (dataSetOption == null || dataSetOption === DataSetViewModel.placeHolderOption || dataSetOption === DataSetViewModel.fetchingOption) {
            return;
        }

        this._dataSetOptions.update({ Type: CollectionChangeType.Remove, OldItems: [DataSetViewModel.placeHolderOption] })

        this._scenarioDataService.setCurrentDataSet(dataSetOption.value);
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