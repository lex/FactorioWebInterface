import { IContainer } from "./container";

export abstract class ComponentBase {
    private _attached = false;
    protected _parent: IContainer | null;

    get attached() { return this._attached; }
    get parent(): IContainer | null { return this._parent; }
    set parent(value: IContainer | null) { this._parent = value; }
    abstract get root(): HTMLElement;

    attach(): void {
        if (this._attached) {
            return;
        }

        this.attachOverride();
        this._attached = true;
    }

    dettach(): void {
        if (!this._attached) {
            return;
        }

        this.dettachOverride();
        this._attached = false;
    }

    protected attachOverride(): void { }
    protected dettachOverride(): void { }
}

