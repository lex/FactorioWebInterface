import { Observable } from "../utils/observable";
import { Binding } from "../utils/binding";
import { BindingStore } from "../utils/BindingStore";
import { TooltipService } from "../services/tooltipService";
import { ObjectBindingTarget } from "../utils/bindingTarget";
export class BaseElement extends HTMLElement {
    constructor() {
        super();
        this.lifecycleObservable = new Observable();
    }
    static bindTooltip(self, source) {
        let target = new ObjectBindingTarget(self, 'tooltip');
        let binding = new Binding(target, source);
        BaseElement.setBinding(self, BaseElement.bindingKeys.tooltip, binding);
        return self;
    }
    static setBinding(self, key, binding) {
        let bindingStore = BindingStore.getOrNew(self);
        bindingStore.set(key, binding);
        if (self.isConnected) {
            binding === null || binding === void 0 ? void 0 : binding.connected();
        }
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
    //attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    //    this.lifecycleObservable.raise('attributeChangedCallback');
    //}
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
BaseElement.bindingKeys = {
    tooltip: {}
};
//# sourceMappingURL=baseElement.js.map