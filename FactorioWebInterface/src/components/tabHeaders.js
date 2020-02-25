import "./tabHeaders.ts.less";
export class TabHeaders extends HTMLElement {
    constructor(children) {
        super();
        children = children || [];
        this.append(...children);
    }
}
customElements.define('a-tab-headers', TabHeaders);
//# sourceMappingURL=tabHeaders.js.map