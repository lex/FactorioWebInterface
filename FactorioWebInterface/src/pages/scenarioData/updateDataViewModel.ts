import { ObservableObject } from "../../utils/observableObject";
import { ScenarioDataService } from "./scenarioDataService";

export class UpdateDataViewModel extends ObservableObject {
    private _scenarioDataService: ScenarioDataService;

    private _fields = {
        DataSet: null as string,
        Key: null as string,
        Value: null as string
    }

    get DataSet(): string {
        return this._fields.DataSet;
    }
    set DataSet(value: string) {
        this.set('DataSet', value);
    }

    get Key(): string {
        return this._fields.Key;
    }
    set Key(value: string) {
        this.set('Key', value);
    }

    get Value(): string {
        return this._fields.Value;
    }
    set Value(value: string) {
        this.set('Value', value);
    }

    constructor(scenarioDataService: ScenarioDataService) {
        super();

        this._scenarioDataService = scenarioDataService;
    }

    private set(propertyName: string, value: any) {
        return this.setAndRaise(this._fields, propertyName, value);
    }

    update() {
        this._scenarioDataService.update(this._fields);
    }
}