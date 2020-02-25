import "./stackPanel.ts.less";
import { BaseElement } from "./baseElement";
export class StackPanel extends BaseElement {
    constructor(direction) {
        super();
        this.style.flexDirection = direction || StackPanel.direction.row;
    }
}
StackPanel.direction = {
    row: 'row',
    rowReverse: 'row-reverse',
    column: 'column',
    columnReverse: 'column-reverse'
};
customElements.define('a-stack-panel', StackPanel);
//# sourceMappingURL=stackPanel.js.map