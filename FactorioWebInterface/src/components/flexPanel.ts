import "./flexPanel.ts.less";
import { BaseElement } from "./baseElement";

export class FlexPanel extends BaseElement {
    static readonly classes = {
        horizontal: 'horizontal',
        vertical: 'vertical',
        wrap: 'wrap',
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

    constructor(...classes: string[]) {
        super();

        this.classList.add(...classes);
    }
}

customElements.define('a-flex-panel', FlexPanel);