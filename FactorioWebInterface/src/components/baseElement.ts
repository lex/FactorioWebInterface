import { Observable } from "../utils/observable";
import { Binding } from "../utils/binding";
import { IBindingSource } from "../utils/bindingSource";
import { BindingStore } from "../utils/BindingStore";
import { TooltipService } from "../services/tooltipService";
import { Tooltip } from "./tooltip";
import { ObjectBindingTarget } from "../utils/bindingTarget";

export type Lifecycle = 'connectedCallback' | 'disconnectedCallback' | 'adoptedCallback' | 'attributeChangedCallback';

export interface IBaseElement {
    connectedCallback(): void;
    disconnectedCallback(): void
    adoptedCallback(): void
    onLifecycle(callback: (event: import("./baseElement").Lifecycle) => void): () => void;
    setTooltip(value: string | Node | import("./tooltip").Tooltip): this;
    bindTooltip(source: IBindingSource<string | Node | import("./tooltip").Tooltip>): this;
    setBinding(key: any, binding: Binding): void;
}

export class BaseElement extends HTMLElement implements IBaseElement {
    static readonly bindingKeys = {
        tooltip: {}
    };

    static bindTooltip(self: BaseElement, source: IBindingSource<string | Node | Tooltip>): BaseElement {
        let target = new ObjectBindingTarget(self, 'tooltip');
        let binding = new Binding(target, source);

        BaseElement.setBinding(self, BaseElement.bindingKeys.tooltip, binding);
        return self;
    }

    static setBinding(self: BaseElement, key: any, binding: Binding | undefined): void {
        let bindingStore = BindingStore.getOrNew(self);
        bindingStore.set(key, binding);

        if (self.isConnected) {
            binding?.connected();
        }
    }

    private lifecycleObservable = new Observable<Lifecycle>();

    constructor() {
        super();
    }

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

    //attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    //    this.lifecycleObservable.raise('attributeChangedCallback');
    //}

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
        return BaseElement.bindTooltip(this, source) as this;
    }

    setBinding(key: any, binding: Binding | undefined): void {
        BaseElement.setBinding(this, key, binding);
    }
}