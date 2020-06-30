import { FieldBase } from "./fieldBase";
import { FieldId } from "../utils/fieldId";
import { Label } from "./label";
export class InputFieldBase extends FieldBase {
    constructor(property, header) {
        super();
        let id = FieldId.getNextId();
        if (header instanceof Label) {
            this._label = header;
        }
        else {
            this._label = new Label();
            this._label.innerText = header !== null && header !== void 0 ? header : property;
        }
        this._label.htmlFor = id;
        this.appendChild(this._label);
        this._fieldBody = document.createElement('div');
        this.appendChild(this._fieldBody);
        this._error = document.createElement('div');
        this._fieldBody.appendChild(this._error);
        this._property = property;
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
        this._label.setTooltip(content);
        return this;
    }
}
//# sourceMappingURL=inputFieldBase.js.map