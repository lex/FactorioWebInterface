export class Observable<S, E> {
    private callbacks: ((sender: S, event: E) => void)[] = [];

    constructor() { }

    subscribe(callback: (sender: S, event: E) => void): () => void {
        this.callbacks.push(callback);
        return () => {
            let index = this.callbacks.indexOf(callback);
            if (index !== -1) {
                this.callbacks.splice(index);
            };
        }
    }

    raise(sender: S, event: E) {
        for (var i = 0; i < this.callbacks.length; i++) {
            this.callbacks[i](sender, event);
        }
    }

    static unSubscribe(subscription: () => void): void {
        if (subscription) {
            subscription();
        }
    }
}