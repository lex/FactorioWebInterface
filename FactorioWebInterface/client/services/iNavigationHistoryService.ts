import { IObservable } from "../utils/observable";

export abstract class INavigationHistoryService {
    abstract get onPop(): IObservable<PopStateEvent>;
    abstract push(url: string, data?: any, title?: string): void
    abstract replace(url: string, data?: any, title?: string): void
}