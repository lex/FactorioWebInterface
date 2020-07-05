import { Observable, IObservable } from "../utils/observable";
import { propertyOf } from "../utils/types";

export class MethodInvocation {
    constructor(public readonly name: string, public readonly args: any[] = []) { }
}

export class InvokeBase<T = any>  {
    private _strict: boolean;
    private _methodCalled = new Observable<MethodInvocation>();

    constructor(strict: boolean = false) {
        this._strict = strict;
    }

    get methodCalled(): IObservable<MethodInvocation> {
        return this._methodCalled;
    }

    protected invoked(name: propertyOf<T>, ...args: any[]): void {
        this._methodCalled.raise(new MethodInvocation(name, args))

        if (this._strict) {
            throw new Error(`Method ${name} not implemented.`);
        }
    }
}