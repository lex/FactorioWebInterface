import { IObservable, Observable, NullObservable } from "../utils/observable";

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

export class DelegateCommand<T = void> implements ICommand<T>{
    private _execute: (arg: T) => void;
    private _canExecute?: (arg: T) => boolean

    private _canExecuteChanged: Observable<void>;

    get canExecuteChanged(): IObservable<void> {
        return this._canExecuteChanged;
    }

    constructor(execute: (arg: T) => void, canExecute?: (arg: T) => boolean) {
        this._execute = execute;
        this._canExecute = canExecute;

        if (canExecute == null) {
            this._canExecuteChanged = NullObservable.instance;
        } else {
            this._canExecuteChanged = new Observable();
        }
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

    raiseCanExecuteChanged() {
        this._canExecuteChanged.raise();
    }
}