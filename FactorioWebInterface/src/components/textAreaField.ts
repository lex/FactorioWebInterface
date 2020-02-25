import "./textareaField.ts.less";
import { InputFieldBase } from "./inputFieldBase";
import { EventListener } from "../utils/eventListener";

export class TextareaField extends InputFieldBase {
    private _input: HTMLTextAreaElement;

    constructor(property?: string, header?: string) {
        super(property, header);

        this._input = document.createElement('textarea');
        this._input.id = this._label.htmlFor;
        this._fieldBody.insertBefore(this._input, this._error);
    }

    get value(): string {
        return this._input.value;
    }
    set value(value: string) {
        this._input.value = value;
    }

    get input() {
        return this._input;
    }

    get enabled(): boolean {
        return !this._input.disabled;
    }
    set enabled(value: boolean) {
        this._input.disabled = !value;
    }

    onChange(handler: (value: string) => void): () => void {
        let callback = () => handler(this.value)

        return EventListener.onChange(this._input, callback);
    }
}

customElements.define('a-textarea-field', TextareaField);