import { BasicComponent } from "./BasicComponent";

export class TextBlock extends BasicComponent {
    private _div = document.createElement('div');

    constructor(text = '') {
        super();
        this.text = text;
    }

    get root(): HTMLElement {
        return this._div;
    }

    get text() {
        return this._div.innerText;
    }
    set text(value: string) {
        this._div.innerText = value;
    }
}