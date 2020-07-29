import { ObservableObject } from "../../utils/observableObject";
import { DelegateCommand } from "../../utils/command";
export class UpdateDataViewModel extends ObservableObject {
    constructor(scenarioDataService) {
        super();
        this._fields = {
            DataSet: null,
            Key: null,
            Value: null
        };
        this._scenarioDataService = scenarioDataService;
        this._updateCommand = new DelegateCommand(() => this._scenarioDataService.update(this._fields));
    }
    get DataSet() {
        return this._fields.DataSet;
    }
    set DataSet(value) {
        this.set('DataSet', value);
    }
    get Key() {
        return this._fields.Key;
    }
    set Key(value) {
        this.set('Key', value);
    }
    get Value() {
        return this._fields.Value;
    }
    set Value(value) {
        this.set('Value', value);
    }
    get updateCommand() {
        return this._updateCommand;
    }
    set(propertyName, value) {
        return this.setAndRaise(this._fields, propertyName, value);
    }
}
//# sourceMappingURL=updateDataViewModel.js.map