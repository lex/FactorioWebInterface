import { Observable } from "../utils/observable";

export type Lifecycle = 'connectedCallback' | 'disconnectedCallback' | 'adoptedCallback' | 'attributeChangedCallback';

export class BaseElement extends HTMLElement {
    private lifecycleObservable = new Observable<Lifecycle>();

    constructor() {
        super();
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

    onLifecycle(callback: (event: Lifecycle) => void): () => void {
        return this.lifecycleObservable.subscribe(callback);
    }
}