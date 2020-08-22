import "./field.ts.less";
import { FieldBase } from "./fieldBase";
import { Tooltip } from "./tooltip";
import { Label } from "./label";

export class Field extends FieldBase {
    protected _fieldBody: HTMLDivElement;
    protected _label: HTMLLabelElement;

    header: string;
    value: any;
    error: string;

    constructor(content?: Node | string, header?: string | Label) {
        super();

        if (header instanceof Label) {
            this._label = header;
        } else {
            this._label = new Label();
            this._label.innerText = header ?? '';
        }

        this.appendChild(this._label);

        if (header != null) {
            this._label.append(header);
        }

        this._fieldBody = document.createElement('div');
        this.appendChild(this._fieldBody);

        if (content != null) {
            this._fieldBody.append(content);
        }
    }

    onChange(handler: (value: any) => void): () => void {
        return () => { };
    }

    setTooltip(content: string | Node) {
        let tooltip = new Tooltip(content);
        this._label.appendChild(tooltip);

        return this;
    }
}

customElements.define('a-field', Field);