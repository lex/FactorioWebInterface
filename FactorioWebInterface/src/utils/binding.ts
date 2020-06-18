import { IBindingTarget } from "./bindingTarget";
import { IBindingSource } from "./bindingSource";

export class Binding {
    constructor(public readonly target: IBindingTarget, public readonly source: IBindingSource) { }

    connected() {
        this.source.connected(this.target);
        this.target.connected(this.source);
    }

    disconnected() {
        this.target.disconnected(this.source);
        this.source.disconnected(this.target);
    }
}

