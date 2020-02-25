import "./textareaField.ts.less";
import { InputFieldBase } from "./inputFieldBase";
import { EventListener } from "../utils/eventListener";
export class TextareaField extends InputFieldBase {
    constructor(property, header) {
        super(property, header);
        this._input = document.createElement('textarea');
        this._input.id = this._label.htmlFor;
        this._fieldBody.insertBefore(this._input, this._error);
    }
    get value() {
        return this._input.value;
    }
    set value(value) {
        this._input.value = value;
    }
    get input() {
        return this._input;
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
customElements.define('a-textarea-field', TextareaField);
//# sourceMappingURL=textAreaField.js.map