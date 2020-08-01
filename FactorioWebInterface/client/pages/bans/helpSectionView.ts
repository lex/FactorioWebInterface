import { VirtualComponent } from "../../components/virtualComponent";
import { Collapse } from "../../components/collapse";

export class HelpSectionView extends VirtualComponent {
    constructor() {
        super();

        let content = document.createElement('div');
        content.innerHTML =
            `<p>Bans that are added or removed from this page will be synced with all servers immediately.</p>
             <p>All bans issued in game or at the server console with /ban or /unban with be synced with all servers immediately and automatically have the admin and date time added.</p>
             <p>If a ban is performed on a player that is already banned, the new ban will overwrite the old ban.</p>
             <p>Click on a row to have the values filled into the form.</p>`;
        content.classList.add('text');
        content.style.padding = '0 2rem';

        let collapse = new Collapse('Help', content);
        collapse.open = true;
        collapse.classList.add('border', 'header', 'is-4');
        collapse.style.marginTop = '1rem';

        this._root = collapse
    }
}