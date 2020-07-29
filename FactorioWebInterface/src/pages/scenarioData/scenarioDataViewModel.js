import { UpdateDataViewModel } from "./updateDataViewModel";
import { DataSetViewModel } from "./dataSetViewModel";
export class ScenarioDataViewModel {
    constructor(scenarioDataService) {
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
//# sourceMappingURL=scenarioDataViewModel.js.map