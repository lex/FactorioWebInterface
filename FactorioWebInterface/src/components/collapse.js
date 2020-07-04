'use strict';
import "./collapse.ts.less";
import { FlexPanel } from "./flexPanel";
import { HideableContent } from "./hideableContent";
import { ObjectBindingTarget } from "../utils/bindingTarget";
import { Binding } from "../utils/binding";
import { BaseElement } from "./baseElement";
let collapseButtonTemplate = document.createElement('template');
collapseButtonTemplate.innerHTML = `
<svg width="100%" viewbox="-50 -50 100 100">  
  <path d="M-25 -43.3 L-25 43.3 L50 0 Z" fill="#363636"/>  
</svg>`;
export class CollapseButton extends HTMLElement {
    constructor() {
        super();
        this.appendChild(collapseButtonTemplate.content.cloneNode(true));
    }
}
customElements.define('a-collapse-button', CollapseButton);
export class Collapse extends BaseElement {
    constructor(header, content) {
        super();
        let toggler = (event) => {
            event.stopPropagation();
            this.open = !this.open;
        };
        this._top = new FlexPanel(FlexPanel.classes.horizontal);
        this._top.addEventListener('click', toggler);
        this.appendChild(this._top);
        this._button = new CollapseButton();
        //this._button.addEventListener('click', toggler);
        this._top.appendChild(this._button);
        this._contentPresenter = new HideableContent();
        this.appendChild(this._contentPresenter);
        this.setHeader(header);
        this.setContent(content);
    }
    get open() {
        return typeof this.getAttribute('open') === 'string';
    }
    set open(value) {
        if (value === this.open) {
            return;
        }
        if (value) {
            this.setAttribute('open', '');
        }
        else {
            this.removeAttribute('open');
        }
        this._contentPresenter.open = value;
    }
    get header() {
        let last = this._top.lastChild;
        if (!last.isSameNode(this._button)) {
            return last;
        }
        return undefined;
    }
    setHeader(value) {
        let last = this._top.lastChild;
        if (!last.isSameNode(this._button)) {
            this._top.removeChild(last);
        }
        if (value) {
            if (typeof value === 'string') {
                value = document.createTextNode(value);
            }
            this._top.appendChild(value);
        }
    }
    get content() {
        return this._content;
    }
    setContent(value) {
        this._contentPresenter.setContent(value);
    }
    setOpen(value) {
        this.open = value;
        return this;
    }
    bindOpen(source) {
        let target = new ObjectBindingTarget(this, 'open');
        let binding = new Binding(target, source);
        this.setBinding(Collapse.bindingKeys.open, binding);
        return this;
    }
    get contentPresenter() {
        return this._contentPresenter;
    }
}
Collapse.bindingKeys = Object.assign({ open: {} }, BaseElement.bindingKeys);
customElements.define('a-collapse', Collapse);
//# sourceMappingURL=collapse.js.map