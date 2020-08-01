import { FieldBase } from "./fieldBase";
import { FieldId } from "../utils/fieldId";
import { Tooltip } from "./tooltip";
import { Label } from "./label";
import { ValidationLabel } from "./validationLabel";

export abstract class InputFieldBase extends FieldBase {
    protected _label: Label;
    protected _fieldBody: HTMLDivElement;
    protected _error: ValidationLabel;

    constructor(property?: string, header?: string | Label) {
        super();

        let id = FieldId.getNextId();

        if (header instanceof Label) {
            this._label = header;
        } else {
            this._label = new Label();
            this._label.innerText = header ?? property;
        }

        this._label.htmlFor = id;
        this.appendChild(this._label);

        this._fieldBody = document.createElement('div');
        this.appendChild(this._fieldBody);

        this._error = new ValidationLabel();
        this._fieldBody.appendChild(this._error);

        this._property = property;
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

    setTooltip(content: string | Node | Tooltip): this {
        this._label.setTooltip(content);
        return this;
    }
}