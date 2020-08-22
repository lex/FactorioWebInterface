import "./timeField.ts.less";
import { InputFieldBase } from "./inputFieldBase";
import { EventListener } from "../utils/eventListener";
import { Label } from "./label";

export class TimeField extends InputFieldBase {
    private _input: HTMLInputElement;

    constructor(property?: string, header?: string | Label) {
        super(property, header);

        this._input = document.createElement('input');
        this._input.id = this._label.htmlFor;
        this._input.type = 'time';
        this._input.step = '1';
        this._fieldBody.insertBefore(this._input, this._error);
    }

    get value(): Date {
        return this._input.valueAsDate;
    }
    set value(value: Date) {
        if (value === this.value) {
            return;
        }

        let time = new Date(value);
        time.setUTCHours(time.getUTCHours(), time.getUTCMinutes(), time.getUTCSeconds(), 0);
        this._input.valueAsDate = time;
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

customElements.define('a-time-field', TimeField);