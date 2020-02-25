import "./textInput.ts.less";
import { EventListener } from "../utils/eventListener";
import { BindingSource } from "../utils/bindingSource";
export class TextInput extends HTMLInputElement {
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
    bind(source, property) {
        this._bindingSource = new BindingSource(source, property);
        this.connectBinding();
    }
    connectedCallback() {
        this.connectBinding();
    }
    disconnectedCallback() {
        this.disconnectBinding();
    }
    connectBinding() {
        if (!this.isConnected) {
            return;
        }
        this.disconnectBinding();
        let binding = this._bindingSource;
        if (binding == null) {
            return;
        }
        this.value = binding.source[binding.property];
        let sub1 = binding.source.propertyChanged(binding.property, event => this.value = event);
        let sub2 = this.onChange(event => binding.source[binding.property] = event);
        this._subscription = () => {
            sub1();
            sub2();
        };
    }
    disconnectBinding() {
        if (this._subscription != null) {
            this._subscription();
            this._subscription = null;
        }
    }
}
customElements.define('a-text-input', TextInput, { extends: 'input' });
//# sourceMappingURL=textInput.js.map