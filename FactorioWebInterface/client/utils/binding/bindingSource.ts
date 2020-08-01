import { IBindingTarget } from "./bindingTarget";
import { ObservableProperty, IObservableProperty } from "../observableProperty";
import { IObservableObject } from "../observableObject";

export interface IBindingSource<T = any> {
    get(): T;
    set(value: T): void;
    connected(target: IBindingTarget<T>): void;
    disconnected(target: IBindingTarget<T>): void;
}

export class PropertyBindingSource<T = any> implements IBindingSource<T>{
    constructor(private value) { }

    get(): T {
        return this.value;
    }
    set(value: T): void {
        this.value = value;
    }

    connected(target: IBindingTarget<T>): void {
        target.set(this.get());
    }

    disconnected(target: IBindingTarget<T>): void { }
}

export class ObservablePropertyBindingSource<T = any> implements IBindingSource<T>{
    private _subscription: () => void;

    constructor(public readonly property: ObservableProperty<T>) { }

    get(): T {
        return this.property.value;
    }
    set(value: T): void {
        this.property.raise(value);
    }

    connected(target: IBindingTarget<T>): void {
        this._subscription = this.property.bind(event => target.set(event));
    }

    disconnected(target: IBindingTarget<T>): void {
        if (this._subscription == null) {
            return;
        }

        this._subscription();
        this._subscription = undefined;
    }
}

export class ReadonlyObservablePropertyBindingSource<T = any> implements IBindingSource<T>{
    private _subscription: () => void;

    constructor(public readonly property: IObservableProperty<T>) { }

    get(): T {
        return this.property.value;
    }
    set(value: T): void {
    }

    connected(target: IBindingTarget<T>): void {
        this._subscription = this.property.bind(event => target.set(event));
    }

    disconnected(target: IBindingTarget<T>): void {
        if (this._subscription == null) {
            return;
        }

        this._subscription();
        this._subscription = undefined;
    }
}

export class ObjectBindingSource<T = any> implements IBindingSource<T>{
    constructor(public readonly object: object, public readonly propertyName: string) { }

    get(): T {
        return this.object[this.propertyName];
    }
    set(value: T): void {
        this.object[this.propertyName] = value;
    }

    connected(target: IBindingTarget<T>): void {
        target.set(this.get());
    }

    disconnected(target: IBindingTarget<T>): void { }
}

export class ObservableObjectBindingSource<T = any> implements IBindingSource<T>{
    private _subscription: () => void;

    constructor(public readonly object: IObservableObject, public readonly propertyName: string) { }

    get(): T {
        return this.object[this.propertyName];
    }
    set(value: T): void {
        this.object[this.propertyName] = value;
    }

    connected(target: IBindingTarget<T>): void {
        this._subscription = this.object.bind(this.propertyName, event => target.set(event));
    }

    disconnected(target: IBindingTarget<T>): void {
        if (this._subscription == null) {
            return;
        }

        this._subscription();
        this._subscription = undefined;
    }
}
