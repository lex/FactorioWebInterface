import { Observable } from "../utils/observable";
export class BaseElement extends HTMLElement {
    constructor() {
        super();
        this.lifecycleObservable = new Observable();
    }
    connectedCallback() {
        this.lifecycleObservable.raise('connectedCallback');
    }
    disconnectedCallback() {
        this.lifecycleObservable.raise('disconnectedCallback');
    }
    adoptedCallback() {
        this.lifecycleObservable.raise('adoptedCallback');
    }
    //attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    //    this.lifecycleObservable.raise('attributeChangedCallback');
    //}
    onLifecycle(callback) {
        return this.lifecycleObservable.subscribe(callback);
    }
}
//# sourceMappingURL=baseElement.js.map