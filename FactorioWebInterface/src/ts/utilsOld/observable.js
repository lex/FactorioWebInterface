export class Observable {
    constructor() {
        this.callbacks = [];
    }
    subscribe(callback) {
        this.callbacks.push(callback);
        return () => {
            let index = this.callbacks.indexOf(callback);
            if (index !== -1) {
                this.callbacks.splice(index);
            }
            ;
        };
    }
    raise(sender, event) {
        for (var i = 0; i < this.callbacks.length; i++) {
            this.callbacks[i](sender, event);
        }
    }
    static unSubscribe(subscription) {
        if (subscription) {
            subscription();
        }
    }
}
//# sourceMappingURL=observable.js.map