import { IObservable, Observable } from "../utils/observable";

export interface ICommand<T = void> {
    canExecute(arg: T): boolean;
    execute(arg: T): void;
    readonly canExecuteChanged: IObservable<void>;
}

export abstract class CommandBase<T = void> implements ICommand<T> {
    protected _canExecuteChanged = new Observable<void>();

    get canExecuteChanged(): IObservable<void> {
        return this._canExecuteChanged;
    }

    canExecute(arg: T): boolean {
        return true;
    }

    execute(arg: T): void {
    }

    raiseCanExecuteChanged() {
        this._canExecuteChanged.raise();
    }
}

export class DelegateCommand<T = void> extends CommandBase<T>{
    private _execute: (arg: T) => void;
    private _canExecute?: (arg: T) => boolean

    constructor(execute: (arg: T) => void, canExecute?: (arg: T) => boolean) {
        super();

        this._execute = execute;
        this._canExecute = canExecute;
    }

    canExecute(arg: T) {
        if (this._canExecute == null) {
            return true;
        }

        return this._canExecute(arg);
    }

    execute(arg: T) {
        if (this.canExecute(arg)) {
            return this._execute(arg);
        }
    }
}