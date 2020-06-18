import { HTMLLabelBaseElement } from "./htmlLabelBaseElement";

export class Label extends HTMLLabelBaseElement {
}

customElements.define('a-label', Label, { extends: 'label' })