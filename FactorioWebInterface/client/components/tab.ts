import "./tab.ts.less";

export class Tab extends HTMLElement {
    private _content: Node;
    private _contentFunc: () => string | Node;

    constructor(header?: string | Node) {
        super();

        if (header === undefined || header === null) {
            return;
        }

        this.setHeader(header);
    }

    get header() {
        return this.firstChild;
    }

    setHeader(value: string | Node) {
        let node = this.toNode(value);

        this.innerHTML = '';
        this.appendChild(node);

        return this;
    }

    setContent(value: string | Node) {
        this._content = this.toNode(value);
        this._contentFunc = undefined;

        return this;
    }

    setContentFunc(value: () => string | Node) {
        this._contentFunc = value;
        this._content = undefined;

        return this;
    }

    getContent() {
        if (this._content) {
            return this._content;
        }

        if (this._contentFunc) {
            let node = this.toNode(this._contentFunc());

            this._content = node;
            this._contentFunc = undefined;

            return this._content;
        }
    }

    private toNode(node: string | Node): Node {
        if (node instanceof Node) {
            return node;
        }

        return document.createTextNode(node);
    }
}

customElements.define('a-tab', Tab);