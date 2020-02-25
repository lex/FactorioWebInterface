import "./toggleButton.ts.less";
import { EventListener } from "../utils/eventListener";

export class ToggleButton extends HTMLElement {
    constructor(content?: string | Node) {
        super();

        if (typeof content === 'string') {
            let node = document.createTextNode(content);
            this.appendChild(node);
        } else if (content instanceof Node) {
            this.appendChild(content);
        }

        EventListener.onClick(this, (event: MouseEvent) => {
            event.stopPropagation();
            this.toggled = !this.toggled;
        });
    }

    get toggled() {
        return this.hasAttribute('toggled');
    }

    set toggled(state: boolean) {
        if (state) {
            this.setAttribute('toggled', '');
        } else {
            this.removeAttribute('toggled');
        }
    }

    onToggle(handler: (state: boolean) => void): () => void {
        let callback = () => handler(this.toggled);

        return EventListener.onClick(this, callback);
    }
}

customElements.define('a-toggle-button', ToggleButton);
