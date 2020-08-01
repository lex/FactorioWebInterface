import { Observable, IObservable } from "./observable";
import { ObservableObject } from "./observableObject";

export abstract class IClose {
    static isType(obj: object): obj is IClose {
        return IObservable.isType((obj as IClose).closeObservable);
    }

    abstract closeObservable: IObservable<void>;
}

export class CloseBaseViewModel implements IClose {
    private _closeObservable = new Observable<void>();

    get closeObservable(): IObservable<void> {
        return this._closeObservable;
    }

    protected close() {
        this._closeObservable.raise();
    }
}

export class ObservableObjectCloseBaseViewModel extends ObservableObject implements IClose {
    private _closeObservable = new Observable<void>();

    get closeObservable(): IObservable<void> {
        return this._closeObservable;
    }

    protected close() {
        this._closeObservable.raise();
    }
}