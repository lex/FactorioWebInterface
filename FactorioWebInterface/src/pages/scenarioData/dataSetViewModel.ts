import { ScenarioDataService } from "./scenarioDataService";
import { ObservableObject } from "../../utils/observableObject";
import { UpdateDataViewModel } from "./updateDataViewModel";
import { IterableHelper } from "../../utils/iterableHelper";
import { CollectionView, ObservableCollection } from "../../utils/collections/module";
import { Entry } from "./scenarioData";

export class DataSetViewModel extends ObservableObject<DataSetViewModel> {
    private static defaultPlaceholder = 'Select Data Set';
    private static fetchingPlaceholder = 'Fetching...';

    private _scenarioDataService: ScenarioDataService;
    private _updateDataViewModel: UpdateDataViewModel;

    private _header: string;
    private _placeholder: string;
    private _dataSets: CollectionView<string>;

    get header(): string {
        return this._header || 'No Data Set selected';
    }

    get placeholder(): string {
        return this._placeholder;
    }

    get fetchingDataSets(): boolean {
        return this._scenarioDataService.fetchingDataSets;
    }

    get dataSets(): CollectionView<string> {
        return this._dataSets;
    }

    get entries(): ObservableCollection<Entry> {
        return this._scenarioDataService.entries;
    }

    constructor(scenarioDataService: ScenarioDataService, updateDataViewModel: UpdateDataViewModel) {
        super();

        this._scenarioDataService = scenarioDataService;
        this._updateDataViewModel = updateDataViewModel;
        this._header = scenarioDataService.currentDataSet;

        this._dataSets = new CollectionView(scenarioDataService.dataSets);
        this._dataSets.selectedChanged.subscribe(() => this.setDataSet())

        scenarioDataService.entries.subscribe(event => {
            if (scenarioDataService.fetchingEntries) {
                this._header = `${scenarioDataService.currentDataSet} (fetching...)`;
            } else {
                this._header = `${scenarioDataService.currentDataSet} (${scenarioDataService.entries.count})`;
            }

            this.raise('header', this._header);
        });

        scenarioDataService.bind('fetchingDataSets', value => {
            this.setPlaceholder(value ? DataSetViewModel.fetchingPlaceholder : DataSetViewModel.defaultPlaceholder);
            this.raise('fetchingDataSets', value);
        });
    }

    refreshDataSets() {
        this._scenarioDataService.clearDataSets();
        this._scenarioDataService.requestDataSets();
    }

    updateFormFromEntry(entry: Entry) {
        this._updateDataViewModel.DataSet = this._scenarioDataService.currentDataSet;
        this._updateDataViewModel.Key = entry.Key;
        this._updateDataViewModel.Value = entry.Value;
    }

    private setPlaceholder(value: string) {
        if (value === this._placeholder) {
            return;
        }

        this._placeholder = value;
        this.raise('placeholder', value);
    }

    private setDataSet() {
        let selectedDataSet: string = IterableHelper.firstOrDefault(this._dataSets.selected)?.value;

        if (selectedDataSet == null) {
            return;
        }

        this._scenarioDataService.setCurrentDataSet(selectedDataSet);
    }
}