import { ComponentBase } from "./componentBase";
import { Container } from "./container";

export interface StackPanelArgs {
    direction?: string;
    children?: ComponentBase[];
    classes?: string[];
}

export class StackPanel extends Container {
    static direction = {
        row: 'row',
        rowReverse: 'row-reverse',
        column: 'column',
        columnReverse: 'column-reverse'
    }

    private _div: HTMLDivElement;
    private _children: ComponentBase[];

    get root() {
        return this._div;
    }

    constructor(args: StackPanelArgs = {}) {
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

    addChild(child: ComponentBase) {
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

    notifyRootChanged(component: ComponentBase, oldRoot: HTMLElement | null): void {
        if (oldRoot) {
            this.root.removeChild(oldRoot);
        }

        let newRoot = component.root;
        if (newRoot) {
            let index = this._children.indexOf(component);
            if (index == -1) {
                throw 'component not found when notifyRootChanged';;
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