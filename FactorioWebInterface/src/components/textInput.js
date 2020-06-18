import "./textInput.ts.less";
import { EventListener } from "../utils/eventListener";
import { HTMLInputBaseElement } from "./htmlInputBaseElement";
import { ObjectChangeBindingTarget } from "../utils/bindingTarget";
import { Binding } from "../utils/binding";
export class TextInput extends HTMLInputBaseElement {
    constructor() {
        super();
    }
    get enabled() {
        return !this.disabled;
    }
    set enabled(value) {
        this.disabled = !value;
    }
    onChange(handler) {
        let callback = () => handler(this.value);
        return EventListener.onChange(this, callback);
    }
    onKeyUp(handler) {
        return EventListener.onKeyUp(this, handler);
    }
    bindValue(source) {
        let target = new ObjectChangeBindingTarget(this, 'value');
        let binding = new Binding(target, source);
        this.setBinding(TextInput.bindingKeys.value, binding);
        return this;
    }
}
TextInput.bindingKeys = {
    value: {}
};
customElements.define('a-text-input', TextInput, { extends: 'input' });
//# sourceMappingURL=textInput.js.map