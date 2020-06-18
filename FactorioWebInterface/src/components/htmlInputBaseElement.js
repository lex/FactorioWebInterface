import { BaseElement } from "./baseElement";
import { Observable } from "../utils/observable";
import { BindingStore } from "../utils/BindingStore";
import { TooltipService } from "../services/tooltipService";
export class HTMLInputBaseElement extends HTMLInputElement {
    constructor() {
        super(...arguments);
        this.lifecycleObservable = new Observable();
    }
    connectedCallback() {
        var _a;
        (_a = BindingStore.get(this)) === null || _a === void 0 ? void 0 : _a.connected();
        this.lifecycleObservable.raise('connectedCallback');
    }
    disconnectedCallback() {
        var _a;
        (_a = BindingStore.get(this)) === null || _a === void 0 ? void 0 : _a.disconnected();
        this.lifecycleObservable.raise('disconnectedCallback');
    }
    adoptedCallback() {
        this.lifecycleObservable.raise('adoptedCallback');
    }
    onLifecycle(callback) {
        return this.lifecycleObservable.subscribe(callback);
    }
    set tooltip(value) {
        TooltipService.setTooltip(this, value);
    }
    setTooltip(value) {
        this.tooltip = value;
        return this;
    }
    bindTooltip(source) {
        return BaseElement.bindTooltip(this, source);
    }
    setBinding(key, binding) {
        BaseElement.setBinding(this, key, binding);
    }
}
//# sourceMappingURL=htmlInputBaseElement.js.map