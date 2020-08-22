import "./dateField.ts.less";
import { InputFieldBase } from "./inputFieldBase";
import { EventListener } from "../utils/eventListener";
import { Label } from "./label";

export class DateField extends InputFieldBase {
    private _input: HTMLInputElement;

    constructor(property?: string, header?: string | Label) {
        super(property, header);

        this._input = document.createElement('input');
        this._input.id = this._label.htmlFor;
        this._input.type = 'date';
        this._fieldBody.insertBefore(this._input, this._error);
    }

    get value(): Date {
        return this._input.valueAsDate;
    }
    set value(value: Date) {
        if (value === this.value) {
            return;
        }
        this._input.valueAsDate = value;
    }

    get enabled(): boolean {
        return !this._input.disabled;
    }
    set enabled(value: boolean) {
        this._input.disabled = !value;
    }

    onChange(handler: (value: Date) => void): () => void {
        let callback = () => handler(this.value)

        return EventListener.onChange(this._input, callback);
    }
}

customElements.define('a-date-field', DateField);