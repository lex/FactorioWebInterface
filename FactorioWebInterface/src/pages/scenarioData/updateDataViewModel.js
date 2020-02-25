import { ObservableObject } from "../../utils/observableObject";
export class UpdateDataViewModel extends ObservableObject {
    constructor(scenarioDataService) {
        super();
        this._fields = {
            DataSet: null,
            Key: null,
            Value: null
        };
        this._scenarioDataService = scenarioDataService;
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
    set(propertyName, value) {
        return this.setAndRaise(this._fields, propertyName, value);
    }
    update() {
        this._scenarioDataService.update(this._fields);
    }
}
//# sourceMappingURL=updateDataViewModel.js.map