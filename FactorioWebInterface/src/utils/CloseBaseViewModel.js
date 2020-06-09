import { Observable } from "./observable";
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
//# sourceMappingURL=CloseBaseViewModel.js.map