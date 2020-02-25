import { VirtualComponent } from "../../components/virtualComponent";
import { AdminsViewModel } from "./adminsViewModel";
import { HelpSectionView } from "./helpSectionView";
import { AdminsView } from "./adminsView";

export class MainView extends VirtualComponent {
    constructor(adminsViewModel: AdminsViewModel) {
        super();

        let root = document.createElement('div');
        root.classList.add('page-container');
        this._root = root;

        let header = document.createElement('h2');
        header.textContent = 'In Game Admins';
        root.append(header);

        let helpSection = new HelpSectionView();
        root.append(helpSection.root);

        let adminsView = new AdminsView(adminsViewModel);
        root.append(adminsView.root);
    }
}