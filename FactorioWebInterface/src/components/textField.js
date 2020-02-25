import "./textField.ts.less";
import { InputFieldBase } from "./inputFieldBase";
import { EventListener } from "../utils/eventListener";
export class TextField extends InputFieldBase {
    constructor(property, header) {
        super(property, header);
        this._input = document.createElement('input');
        this._input.id = this._label.htmlFor;
        this._fieldBody.insertBefore(this._input, this._error);
    }
    get value() {
        return this._input.value;
    }
    set value(value) {
        this._input.value = value;
    }
    get enabled() {
        return !this._input.disabled;
    }
    set enabled(value) {
        this._input.disabled = !value;
    }
    get placeholder() {
        return this._input.placeholder;
    }
    set placeholder(text) {
        this._input.placeholder = text;
    }
    onChange(handler) {
        let callback = () => handler(this.value);
        return EventListener.onChange(this._input, callback);
    }
    onKeyUp(handler) {
        return EventListener.onKeyUp(this._input, handler);
    }
}
customElements.define('a-text-field', TextField);
//# sourceMappingURL=textField.js.map