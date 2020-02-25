import "./timeField.ts.less";
import { InputFieldBase } from "./inputFieldBase";
import { EventListener } from "../utils/eventListener";
export class TimeField extends InputFieldBase {
    constructor(property, header) {
        super(property, header);
        this._input = document.createElement('input');
        this._input.id = this._label.htmlFor;
        this._input.type = 'time';
        this._input.step = '1';
        this._fieldBody.insertBefore(this._input, this._error);
    }
    get value() {
        return this._input.valueAsDate;
    }
    set value(value) {
        if (value === this.value) {
            return;
        }
        let time = new Date(value);
        time.setUTCHours(time.getUTCHours(), time.getUTCMinutes(), time.getUTCSeconds(), 0);
        this._input.valueAsDate = time;
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
customElements.define('a-time-field', TimeField);
//# sourceMappingURL=timeField.js.map