import { Observable, IObservable } from "./observable";

export class CloseBaseViewModel {
    private _title: string;
    private _closeObservable = new Observable<void>();

    get closeObservable(): IObservable<void> {
        return this._closeObservable;
    }

    protected close() {
        this._closeObservable.raise();
    }
}