import { ComponentBase } from "./componentBase";
export class Div extends ComponentBase {
    constructor() {
        super(...arguments);
        this._div = document.createElement('div');
    }
    get root() {
        return this._div;
    }
}
//# sourceMappingURL=div.js.map