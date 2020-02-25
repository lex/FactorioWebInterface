export interface IObservable<T> {
    subscribe(callback: (event: T) => void): () => void;
}

export class Observable<T> implements IObservable<T> {
    private callbacks: ((event: T) => void)[] = [];

    get subscriberCount(): number {
        return this.callbacks.length;
    }

    subscribe(callback: (event: T) => void): () => void {
        this.callbacks.push(callback);
        return () => {
            let index = this.callbacks.indexOf(callback);
            if (index !== -1) {
                this.callbacks.splice(index);
            };
        }
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
}
