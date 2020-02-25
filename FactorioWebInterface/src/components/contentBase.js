export class ContentBase extends HTMLElement {
    constructor(content) {
        super();
        this.setContent(content);
    }
    get content() {
        return this.firstChild;
    }
    setContent(content) {
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
//# sourceMappingURL=contentBase.js.map