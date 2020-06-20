import "./icon.ts.less";

export class Icon extends HTMLElement {
    static readonly classes = {
        isLeft: 'is-left',
        isLeftAbsolute: 'is-left-absolute',
        upload: 'fa-upload',
        server: 'fa-server',
        play: 'fa-play',
        save: 'fa-save',
        download: 'fa-download',
        stop: 'fa-stop',
        bomb: 'fa-bomb',
        trash: 'fa-trash',
        shareSquare: 'fa-share-square',
        clone: 'fa-clone',
        edit: 'fa-edit',
        compressArrowsAlt: 'fa-compress-arrows-alt'
    }

    constructor(...classes: string[]) {
        super();

        this.classList.add(...classes);
    }
}

export function leftIconWithContent(icon: string, content: string | Node): HTMLElement {
    let iconEle = new Icon(icon, Icon.classes.isLeft);

    let div = document.createElement('div');
    div.append(iconEle, content);

    return div;
}

customElements.define('a-icon', Icon);