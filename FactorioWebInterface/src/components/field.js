import "./field.ts.less";
import { FieldBase } from "./fieldBase";
import { Tooltip } from "./tooltip";
export class Field extends FieldBase {
    constructor(content, header) {
        super();
        this._label = document.createElement('label');
        this.appendChild(this._label);
        if (header != null) {
            this._label.append(header);
        }
        this._fieldBody = document.createElement('div');
        this.appendChild(this._fieldBody);
        if (content != null) {
            this._fieldBody.append(content);
        }
    }
    onChange(handler) {
        return () => { };
    }
    setTooltip(content) {
        let tooltip = new Tooltip(content);
        this._label.appendChild(tooltip);
        return this;
    }
}
customElements.define('a-field', Field);
//# sourceMappingURL=field.js.map