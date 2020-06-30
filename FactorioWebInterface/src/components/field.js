import "./field.ts.less";
import { FieldBase } from "./fieldBase";
import { Tooltip } from "./tooltip";
import { Label } from "./label";
export class Field extends FieldBase {
    constructor(content, header) {
        super();
        if (header instanceof Label) {
            this._label = header;
        }
        else {
            this._label = new Label();
            this._label.innerText = header !== null && header !== void 0 ? header : '';
        }
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