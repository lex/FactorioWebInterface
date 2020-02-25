import { ComponentBase } from "./componentBase";

export class Div extends ComponentBase {
    private _div = document.createElement('div');

    get root(): HTMLElement {
        return this._div;
    }
}