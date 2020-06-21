import "./icon.ts.less";
export class Icon extends HTMLElement {
    constructor(...classes) {
        super();
        this.classList.add(...classes);
    }
}
Icon.classes = {
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
    compressArrowsAlt: 'fa-compress-arrows-alt',
    folderPlus: 'fa-folder-plus'
};
export function leftIconWithContent(icon, content) {
    let iconEle = new Icon(icon, Icon.classes.isLeft);
    let div = document.createElement('div');
    div.append(iconEle, content);
    return div;
}
customElements.define('a-icon', Icon);
//# sourceMappingURL=icon.js.map