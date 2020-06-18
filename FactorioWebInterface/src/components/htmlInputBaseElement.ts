import { BaseElement, Lifecycle, IBaseElement } from "./baseElement";
import { IBindingSource } from "../utils/bindingSource";
import { Binding } from "../utils/binding";
import { Observable } from "../utils/observable";
import { BindingStore } from "../utils/BindingStore";
import { TooltipService } from "../services/tooltipService";
import { Tooltip } from "./tooltip";

export class HTMLInputBaseElement extends HTMLInputElement implements IBaseElement {
    private lifecycleObservable = new Observable<Lifecycle>();

    connectedCallback() {
        BindingStore.get(this)?.connected();
        this.lifecycleObservable.raise('connectedCallback');
    }

    disconnectedCallback() {
        BindingStore.get(this)?.disconnected();
        this.lifecycleObservable.raise('disconnectedCallback');
    }

    adoptedCallback() {
        this.lifecycleObservable.raise('adoptedCallback');
    }

    onLifecycle(callback: (event: Lifecycle) => void): () => void {
        return this.lifecycleObservable.subscribe(callback);
    }

    set tooltip(value: string | Node | Tooltip) {
        TooltipService.setTooltip(this, value);
    }

    setTooltip(value: string | Node | Tooltip): this {
        this.tooltip = value;
        return this;
    }

    bindTooltip(source: IBindingSource<string | Node | Tooltip>): this {
        return BaseElement.bindTooltip(this as any, source) as any;
    }

    setBinding(key: any, binding: Binding): void {
        BaseElement.setBinding(this as any, key, binding);
    }
}