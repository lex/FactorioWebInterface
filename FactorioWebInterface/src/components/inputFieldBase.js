import { FieldBase } from "./fieldBase";
import { FieldId } from "../utils/fieldId";
import { Tooltip } from "./tooltip";
export class InputFieldBase extends FieldBase {
    constructor(property, header) {
        super();
        let id = FieldId.getNextId();
        this._label = document.createElement('label');
        this._label.htmlFor = id;
        this.appendChild(this._label);
        this._fieldBody = document.createElement('div');
        this.appendChild(this._fieldBody);
        this._error = document.createElement('div');
        this._fieldBody.appendChild(this._error);
        this._property = property;
        this.header = header !== null && header !== void 0 ? header : property;
    }
    get header() {
        return this._label.innerText;
    }
    set header(text) {
        this._label.innerText = text;
    }
    get label() {
        return this._label;
    }
    get error() {
        return this._error.innerText;
    }
    set error(errorText) {
        this._error.innerText = errorText;
        if (typeof errorText === 'string') {
            this.setAttribute('invalid', '');
        }
        else {
            this.removeAttribute('invalid');
        }
    }
    set hideLabel(value) {
        this._label.hidden = value;
    }
    setTooltip(content) {
        let tooltip = new Tooltip(content);
        this._label.appendChild(tooltip);
        return this;
    }
}
//# sourceMappingURL=inputFieldBase.js.map