import { Observable } from "../utils/observable";
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
}
//# sourceMappingURL=invokeBase.js.map