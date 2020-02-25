import { ComponentBase } from "./componentBase";
import { ContentContainer } from "./container";

export class App extends ContentContainer {
    private _app: HTMLElement;

    get root(): HTMLElement {
        return this._app;
    }

    constructor(appId = 'app', content?: ComponentBase) {
        super(content);
        this._app = document.getElementById(appId) || document.body;
        this.attach();
    }
}