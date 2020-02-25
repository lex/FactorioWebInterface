import { BasicComponent } from "./BasicComponent";
export class Container extends BasicComponent {
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
}
export class ContentContainer extends Container {
    constructor(content) {
        super();
        this._div = document.createElement('div');
        this.content = content;
    }
    get root() {
        return this._div;
    }
    get content() {
        return this._content;
    }
    set content(content) {
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
    notifyRootChanged(component, oldRoot) {
        if (oldRoot) {
            this.root.removeChild(oldRoot);
        }
        let newRoot = component.root;
        if (newRoot) {
            this.root.appendChild(newRoot);
        }
    }
}
//# sourceMappingURL=container.js.map