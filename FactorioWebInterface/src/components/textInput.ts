import "./textInput.ts.less";
import { EventListener } from "../utils/eventListener";
import { ObservableObject } from "../utils/observableObject";
import { BindingSource } from "../utils/bindingSource";

export class TextInput extends HTMLInputElement {
    private _bindingSource: BindingSource;
    private _subscription: () => void;

    get enabled(): boolean {
        return !this.disabled;
    }
    set enabled(value: boolean) {
        this.disabled = !value;
    }

    constructor() {
        super();
    }

    onChange(handler: (value: string) => void): () => void {
        let callback = () => handler(this.value)

        return EventListener.onChange(this, callback);
    }

    onKeyUp(handler: (event?: KeyboardEvent) => void): () => void {
        return EventListener.onKeyUp(this, handler);
    }

    bind(source: ObservableObject, property: string) {
        this._bindingSource = new BindingSource(source, property);
        this.connectBinding();
    }

    connectedCallback() {
        this.connectBinding();
    }

    disconnectedCallback() {
        this.disconnectBinding();
    }

    private connectBinding() {
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
        }
    }

    private disconnectBinding() {
        if (this._subscription != null) {
            this._subscription();
            this._subscription = null;
        }
    }
}

customElements.define('a-text-input', TextInput, { extends: 'input' })