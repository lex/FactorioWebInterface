import { VirtualComponent } from "../../components/virtualComponent";
import { ModsViewModel } from "./modsViewModel";
import { ModPacksView } from "./ModPacksView";
import { HelpSectionView } from "./helpSectionView";
import { ModPackFilesView } from "./modPackFilesView";
import { FlexPanel } from "../../components/flexPanel";

export class ModsView extends VirtualComponent {
    constructor(modsViewModel: ModsViewModel) {
        super();

        let panel = new FlexPanel(FlexPanel.classes.vertical, FlexPanel.classes.childSpacingLarge, 'page-container');

        let header = document.createElement('h2');
        header.textContent = 'Mod Packs';

        let helpSection = new HelpSectionView();
        let modPacksView = new ModPacksView(modsViewModel.modPacksViewModel);
        let modPackFilesView = new ModPackFilesView(modsViewModel.modPackFilesViewModel);

        panel.append(header, helpSection.root, modPacksView.root, modPackFilesView.root);

        this._root = panel;
    }
}