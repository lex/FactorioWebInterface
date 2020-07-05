import { InvokeBase } from "../invokeBase";
import { Observable } from "../../utils/observable";
export class NavigationHistoryServiceMockBase extends InvokeBase {
    constructor(strict = false) {
        super(strict);
        this._onPop = new Observable();
    }
    get onPop() {
        this.invoked('onPop');
        return this._onPop;
    }
    push(url, data, title) {
        this.invoked('push', url, data, title);
    }
    replace(url, data, title) {
        this.invoked('replace', url, data, title);
    }
}
//# sourceMappingURL=navigationHistoryServiceMockBase.js.map