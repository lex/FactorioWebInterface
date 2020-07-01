import "./progress.ts.less";
import { FlexPanel } from "./flexPanel";
export class Progress extends HTMLElement {
    constructor(contentTemplate) {
        super();
        this._value = 0;
        this._maxValue = 1;
        this._contentTemplate = contentTemplate;
        this._bar = document.createElement('div');
        this._panel = new FlexPanel(FlexPanel.direction.row);
        this._contentHolder = document.createElement('div');
        this._panel.append(this._contentHolder);
        this.value = 0;
        this.append(this._bar, this._panel);
    }
    get value() {
        if (this._value > this._maxValue) {
            return this._maxValue;
        }
        return this._value;
    }
    set value(v) {
        this._value = v;
        let percent = this.percentDone;
        this._bar.style.width = `${percent}%`;
        this.updateContent();
    }
    get maxValue() {
        return this._maxValue;
    }
    set maxValue(value) {
        this._maxValue = value;
    }
    get contentTemplate() {
        return this._contentTemplate;
    }
    set contentTemplate(value) {
        this._contentTemplate = value;
        this.updateContent();
    }
    get percentDone() {
        let max = this._maxValue;
        if (max === 0) {
            max = 1;
        }
        return 100 * this.value / this._maxValue;
    }
    get percentText() {
        let percent = this.percentDone;
        return `${Math.round(percent)}%`;
    }
    setContentTemplate(contentTemplate) {
        this.contentTemplate = contentTemplate;
        return this;
    }
    updateContent() {
        if (this._contentTemplate == null) {
            this._contentHolder.innerHTML = '';
            return;
        }
        let content = this._contentTemplate(this);
        this._contentHolder.innerHTML = '';
        this._contentHolder.append(content);
    }
}
Progress.classes = {
    indeterminate: 'indeterminate'
};
customElements.define('a-progress', Progress);
//# sourceMappingURL=progress.js.map