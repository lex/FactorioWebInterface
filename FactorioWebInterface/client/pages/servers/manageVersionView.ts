import { VirtualComponent } from "../../components/virtualComponent";
import { ManageVersionViewModel } from "./manageVersionViewModel";
import { Modal } from "../../components/modal";
import { Select } from "../../components/select";
import { FlexPanel } from "../../components/flexPanel";
import { Button, iconButton } from "../../components/button";
import { Icon } from "../../components/icon";
import { Table, TextColumn, ColumnTemplate } from "../../components/table";
import { ReadonlyObservablePropertyBindingSource, ObservableObjectBindingSource } from "../../utils/binding/module";

export class ManageVersionView extends VirtualComponent {
    constructor(manageVersionViewModel: ManageVersionViewModel) {
        super();

        let modal = new Modal(this.content(manageVersionViewModel));
        modal.style.minWidth = '480px';

        let title = document.createElement('h4');
        title.textContent = 'Manage Version';
        modal.setHeader(title);

        this._root = modal;
    }

    private content(manageVersionViewModel: ManageVersionViewModel): Node {
        let mainPanel = new FlexPanel(FlexPanel.classes.vertical);
        mainPanel.style.alignItems = 'center';

        let topPanel = new FlexPanel(FlexPanel.classes.horizontal, FlexPanel.classes.childSpacing);

        let versionSelect = new Select(manageVersionViewModel.downloadableVersions)
            .bindIsLoading(new ReadonlyObservablePropertyBindingSource(manageVersionViewModel.isFetchingVersions));

        let downlaodAndUpdateButton = iconButton(Icon.classes.download, 'Download and Update', Button.classes.link)
            .setCommand(manageVersionViewModel.downloadAndUpdateCommand)
            .bindTooltip(new ObservableObjectBindingSource(manageVersionViewModel, 'updateTooltip'));

        topPanel.append(versionSelect, downlaodAndUpdateButton);

        let updateCellBuilder = ((version: string) => {
            return new Button('Update', Button.classes.success)
                .setCommand(manageVersionViewModel.updateCommand)
                .setCommandParameter(version)
                .bindTooltip(new ObservableObjectBindingSource(manageVersionViewModel, 'updateTooltip'));
        });

        let deleteCellBuilder = ((version: string) => {
            return new Button('Delete', Button.classes.danger)
                .setCommand(manageVersionViewModel.deleteCommand)
                .setCommandParameter(version);
        });

        let cachedVersionHeader = document.createElement('h4');
        cachedVersionHeader.textContent = 'Cached Versions';
        cachedVersionHeader.style.margin = '1em';

        let cachedVersionsTable = new Table(manageVersionViewModel.cachedVersions, [
            new TextColumn(null).setHeader(() => 'Version'),
            new ColumnTemplate().setHeader(() => 'Update').setCell(updateCellBuilder).setSortingDisabled(true),
            new ColumnTemplate().setHeader(() => 'Delete').setCell(deleteCellBuilder).setSortingDisabled(true)
        ]);
        cachedVersionsTable.style.width = 'min-content';

        mainPanel.append(topPanel, cachedVersionHeader, cachedVersionsTable);
        return mainPanel;
    }
}