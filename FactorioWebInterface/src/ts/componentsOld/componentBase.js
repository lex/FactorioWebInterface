export class ComponentBase {
    constructor() {
        this._attached = false;
    }
    get attached() { return this._attached; }
    get parent() { return this._parent; }
    set parent(value) { this._parent = value; }
    attach() {
        if (this._attached) {
            return;
        }
        this.attachOverride();
        this._attached = true;
    }
    dettach() {
        if (!this._attached) {
            return;
        }
        this.dettachOverride();
        this._attached = false;
    }
    attachOverride() { }
    dettachOverride() { }
}
//# sourceMappingURL=componentBase.js.map