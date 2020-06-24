import { IBindingSource } from "./bindingSource";
import { EventListener } from "./eventListener";

export interface IBindingTarget<T = any> {
    get(): T;
    set(value: T): void;
    connected(source: IBindingSource<T>): void;
    disconnected(source: IBindingSource<T>): void;
}

export class BindingTargetDelegate<T = any> implements IBindingTarget<T>{
    constructor(private readonly setter: (value: T) => void, private readonly getter?: () => T) { }

    get(): T {
        return this.getter && this.getter();
    }
    set(value: T) {
        this.setter(value);
    }

    connected(source: IBindingSource<T>): void { }
    disconnected(source: IBindingSource<T>): void { }
}

export class ObjectBindingTarget<T = any> implements IBindingTarget<T> {
    constructor(public readonly object: object, public readonly propertyName: string) { }

    get(): T {
        return this.object[this.propertyName];
    }
    set(value: T) {
        this.object[this.propertyName] = value;
    }

    connected(source: IBindingSource<T>): void { }
    disconnected(source: IBindingSource<T>): void { }
}

export class ObjectChangeBindingTarget<T = any> implements IBindingTarget<T> {
    private _subscription: () => void;

    constructor(public readonly object: HTMLInputElement, public readonly propertyName: string) { }

    get(): T {
        return this.object[this.propertyName];
    }
    set(value: T) {
        this.object[this.propertyName] = value;
    }

    connected(source: IBindingSource<T>): void {
        this._subscription = EventListener.onChange(this.object, () => source.set(this.get()));
    }

    disconnected(source: IBindingSource<T>): void {
        if (this._subscription == null) {
            return;
        }

        this._subscription();
        this._subscription = undefined;
    }
}