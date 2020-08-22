import { Observable, IObservable } from "./observable";

export interface IObservableProperty<T> extends IObservable<T> {
    readonly value: T;
    bind(callback: (event: T) => void, subscriptions?: (() => void)[]): () => void;
}

export class ObservableProperty<T> extends Observable<T> implements IObservableProperty<T> {
    private _value: T;

    get value(): T {
        return this._value;
    }

    constructor(value?: T) {
        super();

        this._value = value;
    }

    bind(callback: (event: T) => void, subscriptions?: (() => void)[]): () => void {
        let subscription = this.subscribe(callback, subscriptions);

        callback(this._value);

        return subscription;
    }

    raise(event: T) {
        this._value = event;
        super.raise(event);
    }
}