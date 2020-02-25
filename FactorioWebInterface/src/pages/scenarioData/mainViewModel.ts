import { UpdateDataViewModel } from "./updateDataViewModel";
import { ScenarioDataService } from "./scenarioDataService";
import { DataSetViewModel } from "./dataSetViewModel";

export class MainViewModel {
    private _updateDataViewModel: UpdateDataViewModel;
    private _dataSetViewModel: DataSetViewModel;

    get updateDataViewModel() {
        return this._updateDataViewModel;
    }

    get dataSetViewModel() {
        return this._dataSetViewModel;
    }

    constructor() {
        let scenarioDataService = new ScenarioDataService();

        this._updateDataViewModel = new UpdateDataViewModel(scenarioDataService);
        this._dataSetViewModel = new DataSetViewModel(scenarioDataService, this._updateDataViewModel);
    }
}