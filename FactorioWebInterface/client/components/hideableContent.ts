export class HideableContent extends HTMLElement {
    private _content: Node;
    private _open: boolean;

    constructor(content?: Node | string) {
        super();
        this.setContent(content);
    }

    get content(): Node {
        return this._content;
    }

    setContent(content: Node | string) {
        if (!content) {
            this.innerHTML = '';
            this._content = undefined;
            return;
        }

        if (typeof content === 'string') {
            content = document.createTextNode(content);
        }

        this._content = content;

        if (this.open) {
            this.appendChild(content);
        }
    }

    get open() {
        return this._open;
    }

    set open(value: boolean) {
        if (value === this._open) {
            return;
        }

        this._open = value;

        if (!this._content) {
            return;
        }

        if (value) {
            this.appendChild(this._content);
        } else {
            this.innerHTML = '';
        }
    }
}

customElements.define('a-hideable-content', HideableContent)