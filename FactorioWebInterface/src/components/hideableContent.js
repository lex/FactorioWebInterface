export class HideableContent extends HTMLElement {
    constructor(content) {
        super();
        this.setContent(content);
    }
    get content() {
        return this._content;
    }
    setContent(content) {
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
    set open(value) {
        if (value === this._open) {
            return;
        }
        this._open = value;
        if (!this._content) {
            return;
        }
        if (value) {
            this.appendChild(this._content);
        }
        else {
            this.innerHTML = '';
        }
    }
}
customElements.define('a-hideable-content', HideableContent);
//# sourceMappingURL=hideableContent.js.map