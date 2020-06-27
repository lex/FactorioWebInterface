import { VirtualComponent } from "../../components/virtualComponent";
import { ManageVersionViewModel } from "./manageVersionViewModel";
import { Modal } from "../../components/modal";
import { Select } from "../../components/select";
import { StackPanel } from "../../components/stackPanel";
import { Button, iconButton } from "../../components/button";
import { Icon } from "../../components/icon";
import { Table, TextColumn, ColumnTemplate } from "../../components/table";
import { ReadonlyObservablePropertyBindingSource } from "../../utils/bindingSource";

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
        let mainPanel = new StackPanel(StackPanel.direction.column);
        mainPanel.style.alignItems = 'center';

        let topPanel = new StackPanel(StackPanel.direction.row);

        let versionSelect = new Select(manageVersionViewModel.downloadableVersions)
            .bindIsLoading(new ReadonlyObservablePropertyBindingSource(manageVersionViewModel.isFetchingVersions));

        let downlaodAndUpdateButton = iconButton(Icon.classes.download, 'Download and Update', Button.classes.link)
            .setCommand(manageVersionViewModel.downloadAndUpdateCommand);

        topPanel.append(versionSelect, downlaodAndUpdateButton);

        let updateCellBuilder = ((version: string) => {
            let button = new Button('Update', Button.classes.success)
                .setCommand(manageVersionViewModel.updateCommand)
                .setCommandParameter(version);

            return button;
        });

        let deleteCellBuilder = ((version: string) => {
            let button = new Button('Delete', Button.classes.danger);
            button.onClick((event: MouseEvent) => {
                event.stopPropagation();
                manageVersionViewModel.delete(version);
            });

            return button;
        });

        let cachedVersionHeader = document.createElement('h4');
        cachedVersionHeader.textContent = 'Cached Versions';
        cachedVersionHeader.style.margin = '1em';

        let versionColumn = new TextColumn().setHeader(() => 'Version');
        let cachedVersionsTable = new Table(manageVersionViewModel.cachedVersions, [
            versionColumn,
            new ColumnTemplate().setHeader(() => 'Update').setCell(updateCellBuilder).setSortingDisabled(true),
            new ColumnTemplate().setHeader(() => 'Delete').setCell(deleteCellBuilder).setSortingDisabled(true)
        ]);
        cachedVersionsTable.sortBy(versionColumn, false);
        cachedVersionsTable.style.width = 'min-content';

        mainPanel.append(topPanel, cachedVersionHeader, cachedVersionsTable);
        return mainPanel;
    }
}