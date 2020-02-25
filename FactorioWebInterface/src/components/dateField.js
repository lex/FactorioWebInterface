import "./dateField.ts.less";
import { InputFieldBase } from "./inputFieldBase";
import { EventListener } from "../utils/eventListener";
export class DateField extends InputFieldBase {
    constructor(property, header) {
        super(property, header);
        this._input = document.createElement('input');
        this._input.id = this._label.htmlFor;
        this._input.type = 'date';
        this._fieldBody.insertBefore(this._input, this._error);
    }
    get value() {
        return this._input.valueAsDate;
    }
    set value(value) {
        if (value === this.value) {
            return;
        }
        this._input.valueAsDate = value;
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
}
customElements.define('a-date-field', DateField);
//# sourceMappingURL=dateField.js.map