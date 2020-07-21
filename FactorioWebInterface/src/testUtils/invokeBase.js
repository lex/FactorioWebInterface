import { Observable } from "../utils/observable";
import { AssertionError } from "assert";
export class MethodInvocation {
    constructor(name, args = []) {
        this.name = name;
        this.args = args;
    }
}
export class InvokeBase {
    constructor(strict = false) {
        this._methodsCalled = [];
        this._methodCalled = new Observable();
        this._strict = strict;
    }
    get methodsCalled() {
        return this._methodsCalled;
    }
    get methodCalled() {
        return this._methodCalled;
    }
    invoked(name, ...args) {
        let methodInvocation = new MethodInvocation(name, args);
        this._methodsCalled.push(methodInvocation);
        this._methodCalled.raise(methodInvocation);
        if (this._strict) {
            throw new Error(`Method ${name} not implemented.`);
        }
    }
    assertMethodCalled(name) {
        for (const invocation of this._methodsCalled) {
            if (invocation.name === name) {
                return;
            }
        }
        throw new AssertionError({ message: `The expected method invocation ${name} was not found.`, expected: name });
    }
}
//# sourceMappingURL=invokeBase.js.map