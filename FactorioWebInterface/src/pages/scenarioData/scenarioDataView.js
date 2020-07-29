import { UpdateDataView } from "./updateDataView";
import { VirtualComponent } from "../../components/virtualComponent";
import { HelpSectionView } from "./helpSectionView";
import { DataSetView } from "./dataSetView";
import { FlexPanel } from "../../components/flexPanel";
export class ScenarioDataView extends VirtualComponent {
    constructor(scenarioDataViewModel) {
        super();
        let panel = new FlexPanel(FlexPanel.classes.vertical, FlexPanel.classes.childSpacingLarge, 'page-container');
        let header = document.createElement('h2');
        header.textContent = 'Scenario Data';
        let helpSectionView = new HelpSectionView();
        let updateDataView = new UpdateDataView(scenarioDataViewModel.updateDataViewModel);
        let dataSetView = new DataSetView(scenarioDataViewModel.dataSetViewModel);
        panel.append(header, helpSectionView.root, updateDataView.root, dataSetView.root);
        this._root = panel;
    }
}
//# sourceMappingURL=scenarioDataView.js.map