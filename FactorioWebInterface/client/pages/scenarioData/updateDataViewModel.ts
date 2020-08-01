import { ObservableObject } from "../../utils/observableObject";
import { ScenarioDataService } from "./scenarioDataService";
import { DelegateCommand, ICommand } from "../../utils/command";

export class UpdateDataViewModel extends ObservableObject {
    private _scenarioDataService: ScenarioDataService;

    private _fields = {
        DataSet: null as string,
        Key: null as string,
        Value: null as string
    }

    private _updateCommand: DelegateCommand;

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

    get updateCommand(): ICommand {
        return this._updateCommand;
    }

    constructor(scenarioDataService: ScenarioDataService) {
        super();

        this._scenarioDataService = scenarioDataService;

        this._updateCommand = new DelegateCommand(() => this._scenarioDataService.update(this._fields));
    }

    private set(propertyName: string, value: any) {
        return this.setAndRaise(this._fields, propertyName, value);
    }
}