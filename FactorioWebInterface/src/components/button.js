import "./button.ts.less";
import { EventListener } from "../utils/eventListener";
import { Icon } from "./icon";
import { BaseElement } from "./baseElement";
export class Button extends BaseElement {
    constructor(content, ...classes) {
        super();
        this.append(content);
        this.classList.add(...classes);
        this.onClick((event) => event.stopPropagation());
    }
    get command() {
        return this._command;
    }
    set command(value) {
        this.disconnectCommand();
        this._command = value;
        this.connectCommand();
    }
    get commandParameter() {
        return this._commandParameter;
    }
    set commandParameter(value) {
        this._commandParameter = value;
    }
    get enabled() {
        return !this.hasAttribute('disabled');
    }
    set enabled(value) {
        if (value) {
            this.removeAttribute('disabled');
        }
        else {
            this.setAttribute('disabled', '');
        }
    }
    get content() {
        return this.firstChild;
    }
    set content(value) {
        this.innerHTML = '';
        this.append(value);
    }
    onClick(callback) {
        return EventListener.onClick(this, callback);
    }
    setCommand(command) {
        this.command = command;
        return this;
    }
    setCommandParameter(value) {
        this.commandParameter = value;
        return this;
    }
    connectCommand() {
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
        };
    }
    disconnectCommand() {
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
Button.classes = {
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
export function iconButton(icon, content, ...classes) {
    let iconEle = new Icon(icon, Icon.classes.isLeft);
    let frag = document.createDocumentFragment();
    frag.append(iconEle, content);
    return new Button(frag, ...classes);
}
customElements.define('a-button', Button);
//# sourceMappingURL=button.js.map