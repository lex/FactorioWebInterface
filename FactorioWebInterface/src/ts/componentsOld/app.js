import { ContentContainer } from "./container";
export class App extends ContentContainer {
    constructor(appId = 'app', content) {
        super(content);
        this._app = document.getElementById(appId) || document.body;
        this.attach();
    }
    get root() {
        return this._app;
    }
}
//# sourceMappingURL=app.js.map