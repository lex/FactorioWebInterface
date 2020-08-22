import "./placeholder.ts.less";

export class Placeholder extends HTMLElement {
    static toPlaceholder(value: string | Node | Placeholder): Placeholder {
        if (value instanceof Placeholder) {
            return value;
        }

        return new Placeholder(value);
    }

    constructor(content?: string | Node) {
        super();

        this.append(content);
    }
}

customElements.define('a-placeholder', Placeholder);