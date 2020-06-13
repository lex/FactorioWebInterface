import { Observable, NullObservable } from "../utils/observable";
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
export class DelegateCommand {
    constructor(execute, canExecute) {
        this._execute = execute;
        this._canExecute = canExecute;
        if (canExecute == null) {
            this._canExecuteChanged = NullObservable.instance;
        }
        else {
            this._canExecuteChanged = new Observable();
        }
    }
    get canExecuteChanged() {
        return this._canExecuteChanged;
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
    raiseCanExecuteChanged() {
        this._canExecuteChanged.raise();
    }
}
//# sourceMappingURL=command.js.map