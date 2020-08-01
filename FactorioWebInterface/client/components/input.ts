import { HTMLInputBaseElement } from "./htmlInputBaseElement";

export class Input extends HTMLInputBaseElement {
}

customElements.define('a-input', Input, { extends: 'input' })