import "./flexPanel.ts.less";
import { BaseElement } from "./baseElement";
export class FlexPanel extends BaseElement {
    constructor(direction) {
        super();
        this.style.flexDirection = direction || FlexPanel.direction.row;
    }
}
FlexPanel.direction = {
    row: 'row',
    rowReverse: 'row-reverse',
    column: 'column',
    columnReverse: 'column-reverse'
};
customElements.define('a-flex-panel', FlexPanel);
//# sourceMappingURL=flexPanel.js.map