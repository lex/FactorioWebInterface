import { VirtualComponent } from "../../components/virtualComponent";
import { BansView } from "./bansView";
import { HelpSectionView } from "./helpSectionView";
export class MainView extends VirtualComponent {
    constructor(bansViewModel) {
        super();
        let root = document.createElement('div');
        root.classList.add('page-container-wide');
        this._root = root;
        let header = document.createElement('h2');
        header.textContent = 'Bans';
        root.append(header);
        let helpSection = new HelpSectionView();
        root.append(helpSection.root);
        let bansView = new BansView(bansViewModel);
        root.append(bansView.root);
    }
}
//# sourceMappingURL=mainView.js.map