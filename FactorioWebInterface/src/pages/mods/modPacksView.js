import { VirtualComponent } from "../../components/virtualComponent";
import { Collapse } from "../../components/collapse";
import { ToggleButton } from "../../components/toggleButton";
import { Table, TextColumn, DateTimeColumn, ColumnTemplate } from "../../components/table";
import { Button, iconButton } from "../../components/button";
import { Icon } from "../../components/icon";
export class ModPacksView extends VirtualComponent {
    constructor(modPacksViewModel) {
        super();
        let header = document.createElement('div');
        let thumbtack = document.createElement('i');
        thumbtack.classList.add('fas', 'fa-thumbtack');
        let toggleButton = new ToggleButton(thumbtack);
        toggleButton.setTooltip('Pin the mod packs to keep them in view.');
        toggleButton.style.marginRight = '0.5em';
        header.append(toggleButton, 'Mod Packs');
        let table = new Table(modPacksViewModel.modPacks, [
            new TextColumn('Name'),
            new DateTimeColumn('LastModifiedTime')
                .setHeader(() => 'Last Modified Time'),
            new ColumnTemplate()
                .setHeader(headerCell => {
                headerCell.style.minWidth = '0px';
                headerCell.style.width = '6em';
                return 'Rename';
            })
                .setCell((modPack) => new Button('Rename', Button.classes.link)
                .setCommand(modPacksViewModel.renameCommand)
                .setCommandParameter(modPack))
                .setSortingDisabled(true),
            new ColumnTemplate()
                .setHeader(headerCell => {
                headerCell.style.minWidth = '0px';
                headerCell.style.width = '6em';
                return 'Delete';
            })
                .setCell((modPack) => new Button('Delete', Button.classes.danger)
                .setCommand(modPacksViewModel.deleteCommand)
                .setCommandParameter(modPack))
                .setSortingDisabled(true)
        ]);
        table.onRowClick(event => modPacksViewModel.setSelectModPack(event.item));
        table.classList.add('th-min-width-normal');
        table.style.fontSize = '1rem';
        table.style.fontWeight = 'normal';
        table.style.width = '100%';
        let newButton = iconButton(Icon.classes.folderPlus, 'New', Button.classes.success)
            .setCommand(modPacksViewModel.newCommand);
        let tableContainer = document.createElement('div');
        tableContainer.style.overflowX = 'auto';
        tableContainer.style.margin = '0 1.5rem 1rem 1.5rem';
        tableContainer.style.lineHeight = '1.5';
        tableContainer.append(newButton, table);
        let collapse = new Collapse(header, tableContainer);
        collapse.open = true;
        collapse.classList.add('is-4', 'border', 'header');
        collapse.style.marginTop = '2rem';
        this._root = collapse;
        toggleButton.onToggle(state => {
            if (state) {
                collapse.style.top = 3.5 + 'rem';
                collapse.style.position = 'sticky';
                collapse.style.zIndex = '20';
            }
            else {
                collapse.style.top = '';
                collapse.style.position = '';
            }
        });
    }
}
//# sourceMappingURL=modPacksView.js.map