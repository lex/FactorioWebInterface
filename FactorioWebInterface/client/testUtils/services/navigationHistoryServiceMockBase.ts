import { InvokeBase } from "../invokeBase";
import { PublicPart } from "../../utils/types";
import { INavigationHistoryService } from "../../services/iNavigationHistoryService";
import { IObservable, Observable } from "../../utils/observable";

export class NavigationHistoryServiceMockBase extends InvokeBase<INavigationHistoryService> implements PublicPart<INavigationHistoryService> {
    _onPop = new Observable<PopStateEvent>();

    constructor(strict: boolean = false) {
        super(strict);
    }

    get onPop(): IObservable<PopStateEvent> {
        this.invoked('onPop');
        return this._onPop;
    }

    push(url: string, data?: any, title?: string): void {
        this.invoked('push', url, data, title);
    }

    replace(url: string, data?: any, title?: string): void {
        this.invoked('replace', url, data, title);
    }
}