import "./flexPanel.ts.less";
import { BaseElement } from "./baseElement";

export class FlexPanel extends BaseElement {
    static direction = {
        row: 'row',
        rowReverse: 'row-reverse',
        column: 'column',
        columnReverse: 'column-reverse'
    }

    constructor(direction?: string) {
        super();

        this.style.flexDirection = direction || FlexPanel.direction.row;
    }
}

customElements.define('a-flex-panel', FlexPanel);