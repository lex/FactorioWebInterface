import { noop } from "./functions";
export class Observable {
    constructor() {
        this.callbacks = [];
    }
    get subscriberCount() {
        return this.callbacks.length;
    }
    subscribe(callback, subscriptions) {
        this.callbacks.push(callback);
        let subscription = () => {
            let index = this.callbacks.indexOf(callback);
            if (index !== -1) {
                this.callbacks.splice(index);
            }
            ;
        };
        if (subscriptions != null) {
            subscriptions.push(subscription);
        }
        return subscription;
    }
    raise(event) {
        for (var i = 0; i < this.callbacks.length; i++) {
            this.callbacks[i](event);
        }
    }
    static unSubscribe(subscription) {
        if (subscription) {
            subscription();
        }
    }
    static unSubscribeAll(subscriptions) {
        for (let i = 0; i < subscriptions.length; i++) {
            subscriptions[i]();
        }
        subscriptions.length = 0;
    }
}
export class NullObservable extends Observable {
    get subscriberCount() {
        return 0;
    }
    subscribe(callback, subscriptions) {
        return noop;
    }
    raise(event) {
    }
}
NullObservable.instance = new NullObservable();
//# sourceMappingURL=observable.js.map