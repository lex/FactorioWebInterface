import "./flexPanel.ts.less";
import { BaseElement } from "./baseElement";
export class FlexPanel extends BaseElement {
    constructor(...classes) {
        super();
        this.classList.add(...classes);
    }
}
FlexPanel.classes = {
    horizontal: 'horizontal',
    vertical: 'vertical',
    warp: 'warp',
    reverse: 'reverse',
    spacingNone: 'spacing-none',
    childSpacingSmall: 'child-spacing-small',
    childSpacing: 'child-spacing',
    childSpacingLarge: 'child-spacing-large',
    childSpacingSmallInclusive: 'child-spacing-small-inclusive',
    childSpacingInclusive: 'child-spacing-inclusive',
    childSpacingLargeInclusive: 'child-spacing-large-inclusive',
    largeColumns: 'large-columns'
};
customElements.define('a-flex-panel', FlexPanel);
//# sourceMappingURL=flexPanel.js.map