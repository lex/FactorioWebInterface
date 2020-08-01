export abstract class VirtualComponent {
    protected _root: HTMLElement;

    get root() {
        return this._root;
    }

    constructor(root?: HTMLElement) {
        this._root = root;
    }
}