'use strict';
import "./collapse.ts.less";
import { StackPanel } from "./stackPanel";
import { HideableContent } from "./hideableContent";
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
export class Collapse extends HTMLElement {
    constructor(header, content) {
        super();
        let toggler = (event) => {
            event.stopPropagation();
            this.open = !this.open;
        };
        this._top = new StackPanel(StackPanel.direction.row);
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
    get contentPresenter() {
        return this._contentPresenter;
    }
}
customElements.define('a-collapse', Collapse);
//# sourceMappingURL=collapse.js.map