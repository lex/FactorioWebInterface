import "./checkboxField.ts.less";
import { FieldBase } from "./fieldBase";
import { EventListener } from "../utils/eventListener";
import { FieldId } from "../utils/fieldId";
import { Tooltip } from "./tooltip";
import { Label } from "./label";

export class CheckboxField extends FieldBase {
    private _input: HTMLInputElement;
    private _label: Label;
    private _container: HTMLElement;

    constructor(property?: string, header?: string | Label) {
        super();

        this._property = property;

        let id = FieldId.getNextId();

        this._container = document.createElement('div');
        this.append(this._container);

        this._input = document.createElement('input');
        this._input.type = 'checkbox'
        this._input.id = id;
        this._container.append(this._input);

        if (header instanceof Label) {
            this._label = header;
        } else {
            this._label = new Label();
            this._label.innerText = header ?? property;
        }

        this._label.htmlFor = id;
        this._container.append(this._label);
    }

    get header(): string {
        return this._label.innerText;
    }
    set header(text: string) {
        this._label.innerText = text;
    }

    get value(): boolean {
        return this._input.checked;
    }
    set value(checked: boolean) {
        this._input.checked = checked;
    }

    get error(): string {
        return '';
    }
    set error(errorText: string) {
    }

    get enabled(): boolean {
        return !this._input.disabled;
    }
    set enabled(value: boolean) {
        this._input.disabled = !value;
    }

    onChange(handler: (value: boolean) => void): () => void {
        let callback = () => handler(this.value)

        return EventListener.onChange(this._input, callback);
    }

    setTooltip(content: string | Node | Tooltip) {
        this._label.setTooltip(content);
        return this;
    }
}

customElements.define('a-checkbox-field', CheckboxField);