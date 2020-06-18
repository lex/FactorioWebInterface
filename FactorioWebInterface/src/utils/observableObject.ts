import { Observable } from "./observable";

export interface IObservableObject {
    propertyChanged(propertyName: string, callback: (event) => void): () => void;
    bind(propertyName: string, callback: (event: any) => void, subscriptions?: (() => void)[]): () => void;
}

export abstract class ObservableObject implements IObservableObject {
    private _propertyChangeObservable = new Map<string, Observable<any>>();

    propertyChanged(propertyName: string, callback: (event: any) => void, subscriptions?: (() => void)[]): () => void {
        let observables = this._propertyChangeObservable.get(propertyName);
        if (!observables) {
            observables = new Observable();
            this._propertyChangeObservable.set(propertyName, observables);
        }

        return observables.subscribe(callback, subscriptions);
    }

    bind(propertyName: string, callback: (event: any) => void, subscriptions?: (() => void)[]): () => void {
        let subscription = this.propertyChanged(propertyName, callback, subscriptions);

        callback(this[propertyName]);

        return subscription;
    }

    protected raise(propertyName: string, value: any) {
        let observables = this._propertyChangeObservable.get(propertyName);
        if (!observables) {
            return;
        }

        observables.raise(value);
    }

    protected setAndRaise(fields: object, propertyName: string, value: any) {
        let old = fields[propertyName];

        if (old === value) {
            return false;
        }

        fields[propertyName] = value;
        this.raise(propertyName, value);
        return true;
    }
}