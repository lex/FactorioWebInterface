import "./numberField.ts.less";
import { EventListener } from "../utils/eventListener";
import { InputFieldBase } from "./inputFieldBase";
export class NumberField extends InputFieldBase {
    constructor(property, header) {
        super(property, header);
        this._input = document.createElement('input');
        this._input.id = this._label.htmlFor;
        this._input.type = 'number';
        this._fieldBody.insertBefore(this._input, this._error);
    }
    get value() {
        return this._input.valueAsNumber;
    }
    set value(value) {
        this._input.valueAsNumber = value;
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
customElements.define('a-number-field', NumberField);
//# sourceMappingURL=numberField.js.map