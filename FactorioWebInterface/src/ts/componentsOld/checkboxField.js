import { FieldBase } from "./fieldBase";
export class CheckboxField extends FieldBase {
    constructor(property, header) {
        super(property, header);
        let id = FieldBase.getId();
        this._root = document.createElement('div');
        this._root.classList.add('field', 'is-horizontal');
        let labelDiv = document.createElement('div');
        labelDiv.classList.add('field-label');
        this._root.appendChild(labelDiv);
        let label = document.createElement('label');
        label.classList.add('label');
        label.htmlFor = id;
        label.textContent = header;
        labelDiv.appendChild(label);
        let fieldBody = document.createElement('div');
        fieldBody.classList.add('field-body');
        this._root.appendChild(fieldBody);
        let field = document.createElement('div');
        field.classList.add('field');
        fieldBody.appendChild(field);
        let control = document.createElement('div');
        control.classList.add('control');
        field.appendChild(control);
        this._input = document.createElement('input');
        this._input.id = id;
        this._input.type = 'checkbox';
        this._input.classList.add('checkbox');
        control.appendChild(this._input);
    }
    get root() {
        return this._root;
    }
    get value() {
        return this._input.checked;
    }
    set value(value) {
        this._input.checked = value;
    }
    set valid(validationResult) {
        if (validationResult.valid) {
            this._input.classList.remove('is-danger');
            this._input.setCustomValidity('');
        }
        else {
            this._input.classList.add('is-danger');
            this._input.setCustomValidity(validationResult.error);
        }
    }
    get enabled() {
        return !this._input.disabled;
    }
    set enabled(value) {
        this._input.disabled = !value;
    }
    onChange(handler) {
        this._input.addEventListener('change', handler);
    }
}
//# sourceMappingURL=checkboxField.js.map