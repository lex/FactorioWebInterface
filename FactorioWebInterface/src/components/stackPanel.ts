import "./stackPanel.ts.less";
import { BaseElement } from "./baseElement";

export class StackPanel extends BaseElement {
    static direction = {
        row: 'row',
        rowReverse: 'row-reverse',
        column: 'column',
        columnReverse: 'column-reverse'
    }

    constructor(direction?: string) {
        super();

        this.style.flexDirection = direction || StackPanel.direction.row;
    }
}

customElements.define('a-stack-panel', StackPanel);