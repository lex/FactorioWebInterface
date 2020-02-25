import { Container } from "./container";
export class StackPanel extends Container {
    constructor(args = {}) {
        super();
        this._div = document.createElement('div');
        this._div.style.display = 'flex';
        this._div.style.flexDirection = args.direction || StackPanel.direction.row;
        this._div.classList.add(...['stack-panel', ...args.classes || []]);
        this._children = [];
        let children = args.children || [];
        for (let i = 0; i < children.length; i++) {
            this.addChild(children[i]);
        }
    }
    get root() {
        return this._div;
    }
    addChild(child) {
        this._children.push(child);
        this.appendChild(child);
    }
    attachOverride() {
        for (let i = 0; i < this._children.length; i++) {
            this._children[i].attach();
        }
    }
    dettachOverride() {
        for (let i = 0; i < this._children.length; i++) {
            this._children[i].dettach();
        }
    }
    notifyRootChanged(component, oldRoot) {
        if (oldRoot) {
            this.root.removeChild(oldRoot);
        }
        let newRoot = component.root;
        if (newRoot) {
            let index = this._children.indexOf(component);
            if (index == -1) {
                throw 'component not found when notifyRootChanged';
                ;
            }
            for (let i = index + 1; i < this._children.length; i++) {
                let croot = this._children[i].root;
                if (croot) {
                    this.root.insertBefore(newRoot, croot);
                    return;
                }
            }
            this.root.appendChild(newRoot);
        }
    }
}
StackPanel.direction = {
    row: 'row',
    rowReverse: 'row-reverse',
    column: 'column',
    columnReverse: 'column-reverse'
};
//# sourceMappingURL=stackPanel.js.map