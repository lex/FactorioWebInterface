import { ComponentBase } from "./componentBase";
export class Lazy extends ComponentBase {
    constructor(func) {
        super();
        this._func = func;
    }
    get root() {
        return this.component.root;
    }
    get component() {
        if (!this._component) {
            this._component = this._func();
        }
        return this._component;
    }
    attachOverride() {
        this._component.attach();
    }
    dettachOverride() {
        this._component.dettach();
    }
}
//# sourceMappingURL=lazy.js.map