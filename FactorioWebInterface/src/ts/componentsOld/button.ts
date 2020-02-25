import { ComponentBase } from "./componentBase";

export class Button extends ComponentBase {
    static classes = {
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
    }

    private _button: HTMLButtonElement;

    get root(): HTMLElement {
        return this._button;
    }

    constructor(content: string = '', ...classes: string[]) {
        super();
        if (classes.length === 0) {
            classes = [Button.classes.primary];
        }

        this._button = document.createElement('button');
        this._button.innerText = content;
        this._button.classList.add('button');
        this._button.classList.add(...classes)
    }

    set content(value: string) {
        this._button.innerText = value;
    }

    onClick(callback: (sender: Button, ev: MouseEvent) => void): () => void {
        let handler = (ev) => callback(this, ev);
        this._button.addEventListener('click', handler);
        return () => {
            this._button.removeEventListener('click', handler);
        }
    }
}