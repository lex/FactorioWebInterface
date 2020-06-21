import { Observable, IObservable } from "./observable";
import { ObservableObject } from "./observableObject";
export class IClose {
    static isType(obj) {
        return IObservable.isType(obj.closeObservable);
    }
}
export class CloseBaseViewModel {
    constructor() {
        this._closeObservable = new Observable();
    }
    get closeObservable() {
        return this._closeObservable;
    }
    close() {
        this._closeObservable.raise();
    }
}
export class ObservableObjectCloseBaseViewModel extends ObservableObject {
    constructor() {
        super(...arguments);
        this._closeObservable = new Observable();
    }
    get closeObservable() {
        return this._closeObservable;
    }
    close() {
        this._closeObservable.raise();
    }
}
//# sourceMappingURL=CloseBaseViewModel.js.map