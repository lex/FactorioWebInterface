import { Observable } from "../utils/observable";
export class MethodInvocation {
    constructor(name, args = []) {
        this.name = name;
        this.args = args;
    }
}
export class InvokeBase {
    constructor(strict = false) {
        this._methodCalled = new Observable();
        this._strict = strict;
    }
    get methodCalled() {
        return this._methodCalled;
    }
    invoked(name, ...args) {
        this._methodCalled.raise(new MethodInvocation(name, args));
        if (this._strict) {
            throw new Error(`Method ${name} not implemented.`);
        }
    }
}
//# sourceMappingURL=invokeBase.js.map