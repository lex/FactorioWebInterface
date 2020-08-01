import "./button.ts.less";
import { EventListener } from "../utils/eventListener";
import { ICommand } from "../utils/command";
import { Icon } from "./icon";
import { BaseElement } from "./baseElement";

export class Button extends BaseElement {
    static classes = {
        //white: 'is-white',
        //light: 'is-light',
        //dark: 'is-dark',
        //black: 'is-black',
        //text: 'is-text',

        primary: 'is-primary',
        success: 'is-success',
        link: 'is-link',
        info: 'is-info',
        warning: 'is-warning',
        danger: 'is-danger',
        close: 'close-button'
    };

    private _command: ICommand<any>;
    private _commandSubscription: () => void;
    private _commandParameter: any;

    get command(): ICommand {
        return this._command;
    }

    set command(value: ICommand) {
        this.disconnectCommand();

        this._command = value;
        this.connectCommand();
    }

    get commandParameter(): any {
        return this._commandParameter;
    }

    set commandParameter(value: any) {
        this._commandParameter = value;
    }

    get enabled(): boolean {
        return !this.hasAttribute('disabled');
    }
    set enabled(value: boolean) {
        if (value) {
            this.removeAttribute('disabled');
        } else {
            this.setAttribute('disabled', '');
        }
    }

    get content(): Node {
        return this.firstChild;
    }

    set content(value: Node) {
        this.innerHTML = '';
        this.append(value);
    }

    constructor(content?: string | Node, ...classes: string[]) {
        super();

        this.append(content);
        this.classList.add(...classes);

        this.onClick((event: MouseEvent) => event.stopPropagation());
    }

    onClick(callback: (event: MouseEvent) => void): () => void {
        return EventListener.onClick(this, callback);
    }

    setCommand(command: ICommand<any>): this {
        this.command = command;
        return this;
    }

    setCommandParameter(value: any): this {
        this.commandParameter = value;
        return this;
    }

    private connectCommand() {
        if (this._command == null || !this.isConnected) {
            return;
        }

        let commandExecuteSubscription = EventListener.onClick(this, () => {
            this._command.execute(this._commandParameter);
        });

        this.enabled = this._command.canExecute(this._commandParameter);
        let commnadCanExecuteSubscription = this._command.canExecuteChanged.subscribe(() => {
            this.enabled = this._command.canExecute(this._commandParameter);
        });

        this._commandSubscription = () => {
            commandExecuteSubscription();
            commnadCanExecuteSubscription();
        }
    }

    private disconnectCommand() {
        if (this._commandSubscription) {
            this._commandSubscription();
            this._commandSubscription = null;
        }
    }

    connectedCallback() {
        super.connectedCallback();
        this.connectCommand();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.disconnectCommand();
    }
}

export function iconButton(icon: string, content: string | Node, ...classes: string[]): Button {
    let iconEle = new Icon(icon, Icon.classes.isLeft);
    let frag = document.createDocumentFragment()
    frag.append(iconEle, content);

    return new Button(frag, ...classes);
}

customElements.define('a-button', Button);