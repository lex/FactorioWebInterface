import { BasicComponent } from "./BasicComponent";
export class TextBlock extends BasicComponent {
    constructor(text = '') {
        super();
        this._div = document.createElement('div');
        this.text = text;
    }
    get root() {
        return this._div;
    }
    get text() {
        return this._div.innerText;
    }
    set text(value) {
        this._div.innerText = value;
    }
}
//# sourceMappingURL=textBlock.js.map