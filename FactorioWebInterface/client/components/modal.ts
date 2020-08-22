import "./modal.ts.less";
import { ContentPresenter } from "./contentPresenter";
import { EventListener } from "../utils/eventListener";
import { Button } from "./button";

export class Modal extends HTMLElement {
    private _headerPanel = document.createElement('header');
    private _contentPresenter = new ContentPresenter();
    private _footerPanel = document.createElement('footer');
    private _closeButton: Button

    constructor(content?: string | Node) {
        super();

        this._contentPresenter.setContent(content);
        this.addCloseButton();
        this.append(this._headerPanel, this._contentPresenter, this._footerPanel);
    }

    setHeader(value: string | Node): this {
        let first = this._headerPanel.firstChild;

        if (first == null || first === this._closeButton) {
            this._headerPanel.prepend(value);
            return this;
        }

        first.remove();
        this._headerPanel.prepend(value);
        return this;
    }

    setContent(value: string | Node): this {
        this._contentPresenter.setContent(value);
        return this;
    }

    onClose(callback: (event: MouseEvent) => void): () => void {
        return EventListener.onClick(this._closeButton, callback);
    }

    private addCloseButton() {
        this._closeButton = new Button(null, Button.classes.close)
        this._closeButton.style.marginLeft = 'auto';
        this._headerPanel.append(this._closeButton);
    }
}

customElements.define('a-modal', Modal)