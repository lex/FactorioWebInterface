import { Observable } from "../utils/observable";
export class CommandBase {
    constructor() {
        this._canExecuteChanged = new Observable();
    }
    get canExecuteChanged() {
        return this._canExecuteChanged;
    }
    canExecute(arg) {
        return true;
    }
    execute(arg) {
    }
    raiseCanExecuteChanged() {
        this._canExecuteChanged.raise();
    }
}
export class DelegateCommand extends CommandBase {
    constructor(execute, canExecute) {
        super();
        this._execute = execute;
        this._canExecute = canExecute;
    }
    canExecute(arg) {
        if (this._canExecute == null) {
            return true;
        }
        return this._canExecute(arg);
    }
    execute(arg) {
        if (this.canExecute(arg)) {
            return this._execute(arg);
        }
    }
}
//# sourceMappingURL=command.js.map