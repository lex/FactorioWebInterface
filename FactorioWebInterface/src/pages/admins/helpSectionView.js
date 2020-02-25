import { VirtualComponent } from "../../components/virtualComponent";
import { Collapse } from "../../components/collapse";
export class HelpSectionView extends VirtualComponent {
    constructor() {
        super();
        let content = document.createElement('div');
        content.innerHTML =
            `<p>Admins added or removed from this page will only take affect when a server is restarted.</p>
             <p>Admins issued with /promote or /demote in game or at the server console will <b>not</b> make changes to this list or be synced with other servers.</p>`;
        content.classList.add('text');
        content.style.padding = '0 2rem';
        let collapse = new Collapse('Help', content);
        collapse.open = true;
        collapse.classList.add('border', 'header', 'is-4');
        collapse.style.marginTop = '1rem';
        this._root = collapse;
    }
}
//# sourceMappingURL=helpSectionView.js.map