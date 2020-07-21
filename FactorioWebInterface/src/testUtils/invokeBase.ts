import { Observable, IObservable } from "../utils/observable";
import { propertyOf } from "../utils/types";
import { AssertionError } from "assert";

export class MethodInvocation {
    constructor(public readonly name: string, public readonly args: any[] = []) { }
}

export class InvokeBase<T = any>  {
    private _strict: boolean;

    private _methodsCalled: MethodInvocation[] = [];
    private _methodCalled = new Observable<MethodInvocation>();

    constructor(strict: boolean = false) {
        this._strict = strict;
    }

    get methodsCalled(): ReadonlyArray<MethodInvocation> {
        return this._methodsCalled;
    }

    get methodCalled(): IObservable<MethodInvocation> {
        return this._methodCalled;
    }

    protected invoked(name: propertyOf<T>, ...args: any[]): void {
        let methodInvocation = new MethodInvocation(name, args);
        this._methodsCalled.push(methodInvocation);
        this._methodCalled.raise(methodInvocation);

        if (this._strict) {
            throw new Error(`Method ${name} not implemented.`);
        }
    }

    assertMethodCalled(name: propertyOf<T>): void {
        for (const invocation of this._methodsCalled) {
            if (invocation.name === name) {
                return;
            }
        }

        throw new AssertionError({ message: `The expected method invocation ${name} was not found.`, expected: name });
    }
}