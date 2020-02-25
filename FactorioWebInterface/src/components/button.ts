import "./button.ts.less";
import { EventListener } from "../utils/eventListener";
import { ICommand } from "../utils/command";
import { Icon } from "./icon";

export class Button extends HTMLElement {
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
    }

    private _command: ICommand;
    private _commandSubscription: () => void;

    get command(): ICommand {
        return this._command;
    }

    set command(value: ICommand) {
        this.disconnectCommand();

        this._command = value;
        this.connectCommand();
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
    }

    addClasses(...classes: string[]): Button {
        this.classList.add(...classes);
        return this;
    }

    onClick(callback: (event: MouseEvent) => void): () => void {
        return EventListener.onClick(this, callback);
    }

    setCommand(command: ICommand): this {
        this.command = command;
        return this;
    }

    private connectCommand() {
        if (this._command == null || !this.isConnected) {
            return;
        }

        let commandExecuteSubscription = EventListener.onClick(this, () => {
            this._command.execute();
        });

        this.enabled = this._command.canExecute();
        let commnadCanExecuteSubscription = this._command.canExecuteChanged.subscribe(() => {
            this.enabled = this._command.canExecute();
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
        this.connectCommand();
    }

    disconnectedCallback() {
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