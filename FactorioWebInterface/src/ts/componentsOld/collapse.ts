import { ComponentBase } from "./componentBase";
import { StackPanel } from "./stackPanel";
import { Button } from "./button";

export class Collapse extends ComponentBase {
    private _contentRoot: HTMLElement;
    private _normalDisplay: string;
    private _button: Button;
    private _stackPanel: StackPanel;

    get root() {
        return this._stackPanel.root;
    }

    constructor(content: ComponentBase) {
        super();

        this._button = new Button('Hide', Button.classes.white);
        this._stackPanel = new StackPanel({
            direction: StackPanel.direction.column,
            children: [
                this._button,
                content
            ]
        });

        this._contentRoot = content.root;

        this._normalDisplay = this._contentRoot.style.display;

        this._button.onClick(() => { this.toggle() });
    }

    toggle() {
        let dispaly = this._contentRoot.style.display;
        if (dispaly === 'none') {
            this._contentRoot.style.display = this._normalDisplay;
            this._button.content = 'Hide';
        } else {
            this._contentRoot.style.display = 'none';
            this._button.content = 'Show';
        }
    }

    attachOverride() {
        this._stackPanel.attach();
    }

    dettachOverride() {
        this._stackPanel.dettach();
    }
}