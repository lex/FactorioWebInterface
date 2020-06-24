import "./placeholder.ts.less";
export class Placeholder extends HTMLElement {
    static toPlaceholder(value) {
        if (value instanceof Placeholder) {
            return value;
        }
        return new Placeholder(value);
    }
    constructor(content) {
        super();
        this.append(content);
    }
}
customElements.define('a-placeholder', Placeholder);
//# sourceMappingURL=placeholder.js.map