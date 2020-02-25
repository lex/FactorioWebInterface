import { ComponentBase } from "./componentBase";
export class BasicComponent extends ComponentBase {
    onClick(handler) {
        let callback = (ev) => handler(this, ev);
        this.root.addEventListener('click', callback);
        return () => {
            this.root.removeEventListener('click', callback);
        };
    }
}
//# sourceMappingURL=BasicComponent.js.map