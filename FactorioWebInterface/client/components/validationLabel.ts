import "./validationLabel.ts.less"
import { BaseElement } from "./baseElement";

export class ValidationLabel extends BaseElement {
    constructor() {
        super();
    }
}

customElements.define('a-validation-label', ValidationLabel);