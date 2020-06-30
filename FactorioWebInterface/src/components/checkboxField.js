import "./checkboxField.ts.less";
import { FieldBase } from "./fieldBase";
import { EventListener } from "../utils/eventListener";
import { FieldId } from "../utils/fieldId";
import { Label } from "./label";
export class CheckboxField extends FieldBase {
    constructor(property, header) {
        super();
        this._property = property;
        let id = FieldId.getNextId();
        this._container = document.createElement('div');
        this.append(this._container);
        this._input = document.createElement('input');
        this._input.type = 'checkbox';
        this._input.id = id;
        this._container.append(this._input);
        if (header instanceof Label) {
            this._label = header;
        }
        else {
            this._label = new Label();
            this._label.innerText = header !== null && header !== void 0 ? header : property;
        }
        this._label.htmlFor = id;
        this._container.append(this._label);
    }
    get header() {
        return this._label.innerText;
    }
    set header(text) {
        this._label.innerText = text;
    }
    get value() {
        return this._input.checked;
    }
    set value(checked) {
        this._input.checked = checked;
    }
    get error() {
        return '';
    }
    set error(errorText) {
    }
    get enabled() {
        return !this._input.disabled;
    }
    set enabled(value) {
        this._input.disabled = !value;
    }
    onChange(handler) {
        let callback = () => handler(this.value);
        return EventListener.onChange(this._input, callback);
    }
    setTooltip(content) {
        this._label.setTooltip(content);
        return this;
    }
}
customElements.define('a-checkbox-field', CheckboxField);
//# sourceMappingURL=checkboxField.js.map