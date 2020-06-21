import { Observable } from "./observable";
import { propertyOf } from "./types";

export interface IObservableObject<T = any> {
    propertyChanged(propertyName: propertyOf<T>, callback: (event) => void): () => void;
    bind(propertyName: string, callback: (event: any) => void, subscriptions?: (() => void)[]): () => void;
}

export abstract class ObservableObject<T = any> implements IObservableObject<T> {
    private _propertyChangeObservable = new Map<string, Observable<any>>();

    propertyChanged(propertyName: propertyOf<T>, callback: (event: any) => void, subscriptions?: (() => void)[]): () => void {
        let observables = this._propertyChangeObservable.get(propertyName);
        if (!observables) {
            observables = new Observable();
            this._propertyChangeObservable.set(propertyName, observables);
        }

        return observables.subscribe(callback, subscriptions);
    }

    bind(propertyName: propertyOf<T>, callback: (event: any) => void, subscriptions?: (() => void)[]): () => void {
        let subscription = this.propertyChanged(propertyName, callback, subscriptions);

        callback(this[propertyName as string]);

        return subscription;
    }

    protected raise(propertyName: propertyOf<T>, value: any) {
        let observables = this._propertyChangeObservable.get(propertyName);
        if (!observables) {
            return;
        }

        observables.raise(value);
    }

    protected setAndRaise(fields: object, propertyName: propertyOf<T>, value: any) {
        let old = fields[propertyName as string];

        if (old === value) {
            return false;
        }

        fields[propertyName as string] = value;
        this.raise(propertyName, value);
        return true;
    }
}