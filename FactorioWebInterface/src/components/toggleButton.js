import "./toggleButton.ts.less";
import { EventListener } from "../utils/eventListener";
import { BaseElement } from "./baseElement";
export class ToggleButton extends BaseElement {
    constructor(content) {
        super();
        if (typeof content === 'string') {
            let node = document.createTextNode(content);
            this.appendChild(node);
        }
        else if (content instanceof Node) {
            this.appendChild(content);
        }
        EventListener.onClick(this, (event) => {
            event.stopPropagation();
            this.toggled = !this.toggled;
        });
    }
    get toggled() {
        return this.hasAttribute('toggled');
    }
    set toggled(state) {
        if (state) {
            this.setAttribute('toggled', '');
        }
        else {
            this.removeAttribute('toggled');
        }
    }
    onToggle(handler) {
        let callback = () => handler(this.toggled);
        return EventListener.onClick(this, callback);
    }
}
customElements.define('a-toggle-button', ToggleButton);
//# sourceMappingURL=toggleButton.js.map