import { VirtualComponent } from "../../components/virtualComponent";
import { ModPacksView } from "./ModPacksView";
import { HelpSectionView } from "./helpSectionView";
export class ModsView extends VirtualComponent {
    constructor(modsViewModel) {
        super();
        let root = document.createElement('div');
        root.classList.add('page-container');
        this._root = root;
        let header = document.createElement('h2');
        header.textContent = 'Mod Packs';
        let helpSection = new HelpSectionView();
        let modPacksView = new ModPacksView(modsViewModel.modPacksViewModel);
        root.append(header, helpSection.root, modPacksView.root);
    }
}
//# sourceMappingURL=ModsView.js.map