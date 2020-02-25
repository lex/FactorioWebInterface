import { MainViewModel } from "./mainViewModel";
import { UpdateDataView } from "./updateDataView";
import { VirtualComponent } from "../../components/virtualComponent";
import { HelpSectionView } from "./helpSectionView";
import { DataSetView } from "./dataSetView";
export class MainView extends VirtualComponent {
    constructor() {
        super();
        let mainViewModel = new MainViewModel();
        let root = document.createElement('div');
        root.classList.add('page-container');
        let header = document.createElement('h2');
        header.textContent = 'Scenario Data';
        root.appendChild(header);
        let helpSectionView = new HelpSectionView();
        root.appendChild(helpSectionView.root);
        let updateDataView = new UpdateDataView(mainViewModel.updateDataViewModel);
        root.appendChild(updateDataView.root);
        let dataSetView = new DataSetView(mainViewModel.dataSetViewModel);
        root.appendChild(dataSetView.root);
        this._root = root;
    }
}
//# sourceMappingURL=mainView.js.map