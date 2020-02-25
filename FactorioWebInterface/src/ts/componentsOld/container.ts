import { ComponentBase } from "./componentBase";
import { BasicComponent } from "./BasicComponent";

export interface IContainer {
    notifyRootChanged(component: ComponentBase, oldRoot: HTMLElement | null): void;
    appendChild(child: ComponentBase): void;
    removeChild(child: ComponentBase): void;
}

export abstract class Container extends BasicComponent implements IContainer {
    abstract notifyRootChanged(component: ComponentBase, oldRoot: HTMLElement | null): void;

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
}

export class ContentContainer extends Container {
    private _div = document.createElement('div');
    private _content: ComponentBase;

    get root(): HTMLElement {
        return this._div;
    }

    get content() {
        return this._content;
    }

    set content(content: ComponentBase) {
        if (this._content === content) {
            return;
        }

        if (this._content) {
            this.removeChild(this._content);
        }

        this._content = content;

        if (content) {
            this.appendChild(content);
        }
    }

    constructor(content?: ComponentBase) {
        super();
        this.content = content;
    }

    notifyRootChanged(component: ComponentBase, oldRoot: HTMLElement | null): void {
        if (oldRoot) {
            this.root.removeChild(oldRoot);
        }

        let newRoot = component.root;
        if (newRoot) {
            this.root.appendChild(newRoot);
        }
    }
}