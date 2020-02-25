import { ComponentBase } from "./componentBase";
export class If extends ComponentBase {
    constructor(component, enabled = true) {
        super();
        this._component = component;
        component.parent = this;
        this.enabled = enabled;
    }
    get root() {
        if (!this._enabled) {
            return null;
        }
        return this._component.root;
    }
    get enabled() {
        return this._enabled;
    }
    set enabled(value) {
        if (value === this.enabled) {
            return;
        }
        let oldRoot = this.root;
        this._enabled = value;
        this.update(oldRoot);
    }
    notifyRootChanged(component, oldRoot) {
        if (!this._enabled) {
            return;
        }
        this.update(oldRoot);
    }
    appendChild(child) {
        child.parent = this;
        let childRoot = child.root;
        if (childRoot) {
            this.root.appendChild(child.root);
        }
        if (this.attached) {
            child.attach();
        }
    }
    removeChild(child) {
        child.dettach();
        let childRoot = child.root;
        if (childRoot) {
            this.root.removeChild(childRoot);
        }
        child.parent = null;
    }
    attachOverride() {
        if (this._enabled) {
            this._component.attach();
        }
    }
    dettachOverride() {
        this._component.dettach();
    }
    update(oldRoot) {
        if (!this._parent) {
            return;
        }
        if (this._enabled) {
            this._parent.notifyRootChanged(this, oldRoot);
            if (this.attached) {
                this._component.attach();
            }
        }
        else {
            this._parent.notifyRootChanged(this, oldRoot);
            this._component.dettach();
        }
    }
}
//# sourceMappingURL=if.js.map