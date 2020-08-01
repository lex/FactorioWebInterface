export abstract class ContentBase extends HTMLElement {
    constructor(content?: Node | string) {
        super();
        this.setContent(content);
    }

    get content(): Node {
        return this.firstChild;
    }

    setContent(content: Node | string) {
        if (this.content === content) {
            return;
        }

        this.innerHTML = '';

        if (!content) {
            return;
        }

        if (typeof content === 'string') {
            content = document.createTextNode(content);
        }

        this.appendChild(content);
    }
}