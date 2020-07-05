import { Observable } from "../utils/observable";
export class NavigationHistoryService {
    constructor() {
        this._onPop = new Observable();
        window.addEventListener('popstate', event => {
            this._onPop.raise(event);
        });
    }
    get onPop() {
        return this._onPop;
    }
    push(url, data, title = '') {
        history.pushState(data, title, url);
    }
    replace(url, data, title) {
        history.replaceState(data, title, url);
    }
}
//# sourceMappingURL=navigationHistoryService.js.map