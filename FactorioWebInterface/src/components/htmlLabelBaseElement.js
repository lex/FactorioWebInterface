import { BaseElement } from "./baseElement";
import { Observable } from "../utils/observable";
import { TooltipService } from "../services/tooltipService";
import { BindingStore } from "../utils/binding/module";
export class HTMLLabelBaseElement extends HTMLLabelElement {
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
    set content(value) {
        BaseElement.setContent(this, value);
    }
    setContent(value) {
        this.content = value;
        return this;
    }
    bindContent(source) {
        return BaseElement.bindContent(this, source);
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
    addClasses(...classes) {
        this.classList.add(...classes);
        return this;
    }
}
//# sourceMappingURL=htmlLabelBaseElement.js.map