import "./progress.ts.less";
import { FlexPanel } from "./flexPanel";

export class Progress extends HTMLElement {
    static readonly classes = {
        indeterminate: 'indeterminate'
    }

    private _bar: HTMLDivElement;
    private _panel: FlexPanel;
    private _contentHolder: HTMLDivElement;

    private _value = 0;
    private _maxValue = 1;
    private _contentTemplate: (progressElement: Progress) => string | Node;

    get value(): number {
        if (this._value > this._maxValue) {
            return this._maxValue;
        }

        return this._value;
    }
    set value(v: number) {
        this._value = v;

        let percent = this.percentDone;
        this._bar.style.width = `${percent}%`;

        this.updateContent();
    }

    get maxValue(): number {
        return this._maxValue;
    }
    set maxValue(value: number) {
        this._maxValue = value;
    }

    get contentTemplate(): (progressElement: Progress) => string | Node {
        return this._contentTemplate;
    }
    set contentTemplate(value: (progressElement: Progress) => string | Node) {
        this._contentTemplate = value;
        this.updateContent();
    }

    get percentDone(): number {
        let max = this._maxValue;
        if (max === 0) {
            max = 1;
        }

        return 100 * this.value / this._maxValue;
    }

    get percentText(): string {
        let percent = this.percentDone;
        return `${Math.round(percent)}%`;
    }

    constructor(contentTemplate?: (progressElement: Progress) => string | Node) {
        super();

        this._contentTemplate = contentTemplate;

        this._bar = document.createElement('div');
        this._panel = new FlexPanel(FlexPanel.classes.horizontal);

        this._contentHolder = document.createElement('div');
        this._panel.append(this._contentHolder);

        this.value = 0;
        this.append(this._bar, this._panel);
    }

    setContentTemplate(contentTemplate: (progressElement: Progress) => string | Node): this {
        this.contentTemplate = contentTemplate;
        return this;
    }

    private updateContent() {
        if (this._contentTemplate == null) {
            this._contentHolder.innerHTML = '';
            return;
        }

        let content = this._contentTemplate(this);
        this._contentHolder.innerHTML = '';
        this._contentHolder.append(content);
    }
}

customElements.define('a-progress', Progress);