import { ComponentBase } from "./componentBase";
export abstract class BasicComponent extends ComponentBase {
    onClick(handler: (ComponentBase, ev: MouseEvent) => void): () => void {
        let callback = (ev) => handler(this, ev);
        this.root.addEventListener('click', callback);
        return () => {
            this.root.removeEventListener('click', callback);
        };
    }
}
