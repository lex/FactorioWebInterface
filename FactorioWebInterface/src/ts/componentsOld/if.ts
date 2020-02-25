import { ComponentBase } from "./componentBase";
import { IContainer } from "./container";

export class If extends ComponentBase implements IContainer {
    private _enabled: boolean;
    private _component: ComponentBase;

    get root(): HTMLElement {
        if (!this._enabled) {
            return null;
        }

        return this._component.root;
    }

    get enabled(): boolean {
        return this._enabled;
    }
    set enabled(value: boolean) {
        if (value === this.enabled) {
            return;
        }

        let oldRoot = this.root;
        this._enabled = value;
        this.update(oldRoot);
    }

    constructor(component: ComponentBase, enabled = true) {
        super();
        this._component = component;
        component.parent = this;

        this.enabled = enabled;
    }

    notifyRootChanged(component: ComponentBase, oldRoot: HTMLElement): void {
        if (!this._enabled) {
            return;
        }

        this.update(oldRoot);
    }

    appendChild(child: ComponentBase) {
        child.parent = this;

        let childRoot = child.root;
        if (childRoot) {
            this.root.appendChild(child.root);
        }

        if (this.attached) {
            child.attach();
        }
    }

    removeChild(child: ComponentBase) {
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

    private update(oldRoot: HTMLElement | null) {
        if (!this._parent) {
            return;
        }

        if (this._enabled) {
            this._parent.notifyRootChanged(this, oldRoot);

            if (this.attached) {
                this._component.attach();
            }
        } else {
            this._parent.notifyRootChanged(this, oldRoot);
            this._component.dettach();
        }
    }
}