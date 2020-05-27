import { Observable, IObservable } from "../utils/observable";
import { propertyOf } from "../utils/types";

export class MethodInvocation {
    constructor(public readonly name: string, public readonly args: any[] = []) { }
}

export class InvokeBase<T = any> {
    private _methodCalled = new Observable<MethodInvocation>();

    get methodCalled(): IObservable<MethodInvocation> {
        return this._methodCalled;
    }

    protected invoked(name: propertyOf<T>, ...args: any[]): void {
        this._methodCalled.raise(new MethodInvocation(name, args))
    }
}