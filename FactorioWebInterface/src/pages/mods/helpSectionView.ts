import { VirtualComponent } from "../../components/virtualComponent";
import { Collapse } from "../../components/collapse";

export class HelpSectionView extends VirtualComponent {
    constructor() {
        super();

        let content = document.createElement('div');
        content.innerHTML =
            `<p>Mod packs can be selected for use on the server page.</p>
             <p>Click on a mod pack to manage the files.</p>
             <p>You can upload more than one file at a time.</p>
             <p>Uploads must not exceed 1GB.</p>
             <p>Get From Mod Portal sends only the file names to the server which then fetches the mods from the mod portal.</p>`;
        content.classList.add('text');
        content.style.padding = '0 2rem';

        let collapse = new Collapse('Help', content);
        collapse.open = true;
        collapse.classList.add('border', 'header', 'is-4');
        collapse.style.marginTop = '1rem';

        this._root = collapse
    }
}