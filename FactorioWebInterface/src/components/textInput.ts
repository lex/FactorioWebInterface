import "./textInput.ts.less";
import { EventListener } from "../utils/eventListener";
import { HTMLInputBaseElement } from "./htmlInputBaseElement";
import { IBindingSource } from "../utils/bindingSource";
import { ObjectChangeBindingTarget } from "../utils/bindingTarget";
import { Binding } from "../utils/binding";

export class TextInput extends HTMLInputBaseElement {
    static readonly bindingKeys = {
        value: {}
    };

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

    bindValue(source: IBindingSource<string>): this {
        let target = new ObjectChangeBindingTarget(this, 'value');
        let binding = new Binding(target, source);

        this.setBinding(TextInput.bindingKeys.value, binding);
        return this;
    }
}

customElements.define('a-text-input', TextInput, { extends: 'input' })