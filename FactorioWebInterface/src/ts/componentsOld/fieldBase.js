import { ComponentBase } from "./componentBase";
export class FieldBase extends ComponentBase {
    constructor(_property, _header) {
        super();
        this._property = _property;
        this._header = _header;
    }
    static getId() {
        return 'field' + FieldBase.count++;
    }
    get property() {
        return this._property;
    }
    get header() {
        return this._header;
    }
}
FieldBase.count = 1;
//# sourceMappingURL=fieldBase.js.map