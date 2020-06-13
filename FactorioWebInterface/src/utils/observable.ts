import { noop } from "./functions";

export interface IObservable<T> {
    subscribe(callback: (event: T) => void, subscriptions?: (() => void)[]): () => void;
}

export class Observable<T> implements IObservable<T> {
    private callbacks: ((event: T) => void)[] = [];

    get subscriberCount(): number {
        return this.callbacks.length;
    }

    subscribe(callback: (event: T) => void, subscriptions?: (() => void)[]): () => void {
        this.callbacks.push(callback);
        let subscription = () => {
            let index = this.callbacks.indexOf(callback);
            if (index !== -1) {
                this.callbacks.splice(index);
            };
        }

        if (subscriptions != null) {
            subscriptions.push(subscription);
        }

        return subscription;
    }

    raise(event: T) {
        for (var i = 0; i < this.callbacks.length; i++) {
            this.callbacks[i](event);
        }
    }

    static unSubscribe(subscription: () => void): void {
        if (subscription) {
            subscription();
        }
    }

    static unSubscribeAll(subscriptions: (() => void)[]): void {
        for (let i = 0; i < subscriptions.length; i++) {
            subscriptions[i]();
        }

        subscriptions.length = 0;
    }
}

export class NullObservable extends Observable<any>{
    static readonly instance = new NullObservable();

    get subscriberCount(): number {
        return 0;
    }

    subscribe(callback: (event: any) => void, subscriptions?: (() => void)[]): () => void {
        return noop
    }

    raise(event: any): void {
    }
}
