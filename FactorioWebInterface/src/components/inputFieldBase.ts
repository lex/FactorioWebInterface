import { FieldBase } from "./fieldBase";
import { FieldId } from "../utils/fieldId";
import { Tooltip } from "./tooltip";

export abstract class InputFieldBase extends FieldBase {
    protected _label: HTMLLabelElement;
    protected _fieldBody: HTMLDivElement;
    protected _error: HTMLDivElement;

    constructor(property?: string, header?: string) {
        super();

        let id = FieldId.getNextId();

        this._label = document.createElement('label');
        this._label.htmlFor = id;
        this.appendChild(this._label);

        this._fieldBody = document.createElement('div');
        this.appendChild(this._fieldBody);

        this._error = document.createElement('div');
        this._fieldBody.appendChild(this._error);

        this._property = property;
        this.header = header ?? property;
    }

    get header() {
        return this._label.innerText;
    }
    set header(text: string) {
        this._label.innerText = text;
    }

    get label() {
        return this._label;
    }

    get error() {
        return this._error.innerText;
    }
    set error(errorText: string) {
        this._error.innerText = errorText;

        if (typeof errorText === 'string') {
            this.setAttribute('invalid', '');
        } else {
            this.removeAttribute('invalid');
        }
    }

    set hideLabel(value: boolean) {
        this._label.hidden = value;
    }

    setTooltip(content: string | Node) {
        let tooltip = new Tooltip(content);
        this._label.appendChild(tooltip);

        return this;
    }
}