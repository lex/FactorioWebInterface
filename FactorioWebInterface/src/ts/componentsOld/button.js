import { ComponentBase } from "./componentBase";
export class Button extends ComponentBase {
    constructor(content = '', ...classes) {
        super();
        if (classes.length === 0) {
            classes = [Button.classes.primary];
        }
        this._button = document.createElement('button');
        this._button.innerText = content;
        this._button.classList.add('button');
        this._button.classList.add(...classes);
    }
    get root() {
        return this._button;
    }
    set content(value) {
        this._button.innerText = value;
    }
    onClick(callback) {
        let handler = (ev) => callback(this, ev);
        this._button.addEventListener('click', handler);
        return () => {
            this._button.removeEventListener('click', handler);
        };
    }
}
Button.classes = {
    white: 'is-white',
    light: 'is-light',
    dark: 'is-dark',
    black: 'is-black',
    text: 'is-text',
    primary: 'is-primary',
    link: 'is-link',
    info: 'is-info',
    warning: 'is-warning',
    danger: 'is-danger',
};
//# sourceMappingURL=button.js.map