import { UpdateDataViewModel } from "./updateDataViewModel";
import { ScenarioDataService } from "./scenarioDataService";
import { DataSetViewModel } from "./dataSetViewModel";
export class MainViewModel {
    constructor() {
        let scenarioDataService = new ScenarioDataService();
        this._updateDataViewModel = new UpdateDataViewModel(scenarioDataService);
        this._dataSetViewModel = new DataSetViewModel(scenarioDataService, this._updateDataViewModel);
    }
    get updateDataViewModel() {
        return this._updateDataViewModel;
    }
    get dataSetViewModel() {
        return this._dataSetViewModel;
    }
}
//# sourceMappingURL=mainViewModel.js.map