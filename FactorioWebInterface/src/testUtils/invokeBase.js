import { Observable } from "../utils/observable";
export class MethodInvocation {
    constructor(name, args = []) {
        this.name = name;
        this.args = args;
    }
}
export class InvokeBase {
    constructor() {
        this._methodCalled = new Observable();
    }
    get methodCalled() {
        return this._methodCalled;
    }
    invoked(name, ...args) {
        this._methodCalled.raise(new MethodInvocation(name, args));
    }
}
//# sourceMappingURL=invokeBase.js.map