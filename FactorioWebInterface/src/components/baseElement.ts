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
    onLifecycle(callback: (event: Lifecycle) => void): () => void;

    content: string | Node;
    setContent(value: string | Node): this;
    bindContent(source: IBindingSource<string | Node>): this;

    tooltip: string | Node | Tooltip;
    setTooltip(value: string | Node | Tooltip): this;
    bindTooltip(source: IBindingSource<string | Node | Tooltip>): this;

    setBinding(key: any, binding: Binding): void;

    addClasses(...classes: string[]): this;
}

export class BaseElement extends HTMLElement implements IBaseElement {
    static readonly bindingKeys = {
        content: {},
        tooltip: {}
    };

    static setContent<T extends IBaseElement & HTMLElement>(self: T, content?: string | Node): void {
        self.innerHTML = '';
        if (content != null) {
            self.append(content);
        }
    }

    static bindContent<T extends IBaseElement & HTMLElement>(self: T, source: IBindingSource<string | Node>): T {
        let target = new ObjectBindingTarget(self, 'content');
        let binding = new Binding(target, source);

        BaseElement.setBinding(self, BaseElement.bindingKeys.content, binding);
        return self;
    }

    static bindTooltip<T extends IBaseElement & HTMLElement>(self: T, source: IBindingSource<string | Node | Tooltip>): T {
        let target = new ObjectBindingTarget(self, 'tooltip');
        let binding = new Binding(target, source);

        BaseElement.setBinding(self, BaseElement.bindingKeys.tooltip, binding);
        return self;
    }

    static setBinding<T extends IBaseElement & HTMLElement>(self: T, key: any, binding: Binding | undefined): void {
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

    set content(value: string | Node) {
        BaseElement.setContent(this, value);
    }

    setContent(value: string | Node): this {
        this.content = value;
        return this;
    }

    bindContent(source: IBindingSource<string | Node>): this {
        return BaseElement.bindContent(this, source);
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

    addClasses(...classes: string[]): this {
        this.classList.add(...classes);
        return this;
    }
}