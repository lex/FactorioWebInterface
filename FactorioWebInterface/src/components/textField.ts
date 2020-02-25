import "./textField.ts.less";
import { InputFieldBase } from "./inputFieldBase";
import { EventListener } from "../utils/eventListener";

export class TextField extends InputFieldBase {
    private _input: HTMLInputElement;

    constructor(property?: string, header?: string) {
        super(property, header);

        this._input = document.createElement('input');
        this._input.id = this._label.htmlFor;
        this._fieldBody.insertBefore(this._input, this._error);
    }

    get value(): string {
        return this._input.value;
    }
    set value(value: string) {
        this._input.value = value;
    }

    get enabled(): boolean {
        return !this._input.disabled;
    }
    set enabled(value: boolean) {
        this._input.disabled = !value;
    }

    get placeholder(): string {
        return this._input.placeholder;
    }
    set placeholder(text: string) {
        this._input.placeholder = text;
    }

    onChange(handler: (value: string) => void): () => void {
        let callback = () => handler(this.value)

        return EventListener.onChange(this._input, callback);
    }

    onKeyUp(handler: (event?: KeyboardEvent) => void): () => void {
        return EventListener.onKeyUp(this._input, handler);
    }
}

customElements.define('a-text-field', TextField);