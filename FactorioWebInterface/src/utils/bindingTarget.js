import { EventListener } from "./eventListener";
export class DelegateBindingTarget {
    constructor(setter, getter) {
        this.setter = setter;
        this.getter = getter;
    }
    get() {
        return this.getter && this.getter();
    }
    set(value) {
        this.setter(value);
    }
    connected(source) { }
    disconnected(source) { }
}
export class ObjectBindingTarget {
    constructor(object, propertyName) {
        this.object = object;
        this.propertyName = propertyName;
    }
    get() {
        return this.object[this.propertyName];
    }
    set(value) {
        this.object[this.propertyName] = value;
    }
    connected(source) { }
    disconnected(source) { }
}
export class ObjectChangeBindingTarget {
    constructor(object, propertyName) {
        this.object = object;
        this.propertyName = propertyName;
    }
    get() {
        return this.object[this.propertyName];
    }
    set(value) {
        this.object[this.propertyName] = value;
    }
    connected(source) {
        this._subscription = EventListener.onChange(this.object, () => source.set(this.get()));
    }
    disconnected(source) {
        if (this._subscription == null) {
            return;
        }
        this._subscription();
        this._subscription = undefined;
    }
}
//# sourceMappingURL=bindingTarget.js.map