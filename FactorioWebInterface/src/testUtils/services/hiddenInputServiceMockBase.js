import { InvokeBase } from "../invokeBase";
export class HiddenInputServiceMockBase extends InvokeBase {
    constructor(strict = false) {
        super(strict);
        this._map = new Map();
        this._map.set('serverSelected', '1');
        this._map.set('serverCount', '10');
    }
    getValue(name) {
        this.invoked('getValue');
        return this._map.get(name);
    }
}
//# sourceMappingURL=hiddenInputServiceMockBase.js.map