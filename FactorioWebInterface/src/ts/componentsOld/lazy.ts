import { ComponentBase } from "./componentBase";

export class Lazy extends ComponentBase {
    private _component: ComponentBase | null;
    private _func: () => ComponentBase;

    get root(): HTMLElement {
        return this.component.root;
    }

    get component() {
        if (!this._component) {
            this._component = this._func();
        }
        return this._component;
    }

    constructor(func: () => ComponentBase) {
        super();
        this._func = func;
    }

    attachOverride() {
        this._component.attach();
    }

    dettachOverride() {
        this._component.dettach();
    }
}