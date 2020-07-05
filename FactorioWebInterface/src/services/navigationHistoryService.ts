import { INavigationHistoryService } from "./iNavigationHistoryService";
import { IObservable, Observable } from "../utils/observable";

export class NavigationHistoryService implements INavigationHistoryService {
    private _onPop = new Observable<PopStateEvent>();

    get onPop(): IObservable<PopStateEvent> {
        return this._onPop;
    }

    constructor() {
        window.addEventListener('popstate', event => {
            this._onPop.raise(event);
        });
    }

    push(url: string, data?: any, title = ''): void {
        history.pushState(data, title, url);
    }

    replace(url: string, data?: any, title?: string): void {
        history.replaceState(data, title, url);
    }
}