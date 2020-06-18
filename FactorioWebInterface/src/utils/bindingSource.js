export class PropertyBindingSource {
    constructor(value) {
        this.value = value;
    }
    get() {
        return this.value;
    }
    set(value) {
        this.value = value;
    }
    connected(target) { }
    disconnected(target) { }
}
export class ObservablePropertyBindingSource {
    constructor(property) {
        this.property = property;
    }
    get() {
        return this.property.value;
    }
    set(value) {
        this.property.raise(value);
    }
    connected(target) {
        this._subscription = this.property.bind(event => target.set(event));
    }
    disconnected(target) {
        if (this._subscription == null) {
            return;
        }
        this._subscription();
        this._subscription = undefined;
    }
}
export class ObjectBindingSource {
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
    connected(target) { }
    disconnected(target) { }
}
export class ObservableObjectBindingSource {
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
    connected(target) {
        this._subscription = this.object.bind(this.propertyName, event => target.set(event));
    }
    disconnected(target) {
        if (this._subscription == null) {
            return;
        }
        this._subscription();
        this._subscription = undefined;
    }
}
//# sourceMappingURL=bindingSource.js.map