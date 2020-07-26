import { VirtualComponent } from "../../components/virtualComponent";
import { Collapse } from "../../components/collapse";
import { Table, ColumnTemplate, TextColumn } from "../../components/table";
import { Utils } from "../../ts/utils";
import { Button } from "../../components/button";
import { VirtualForm } from "../../components/virtualForm";
import { TextField } from "../../components/textField";
import { DateField } from "../../components/dateField";
import { CheckboxField } from "../../components/checkboxField";
import { Field } from "../../components/field";
import { TimeField } from "../../components/timeField";
import { TextareaField } from "../../components/textareaField";
import { ToggleButton } from "../../components/toggleButton";
import { FlexPanel } from "../../components/flexPanel";
import { HelpSectionView } from "./helpSectionView";
export class BansView extends VirtualComponent {
    constructor(bansViewModel) {
        super();
        this._bansViewModel = bansViewModel;
        let panel = new FlexPanel(FlexPanel.classes.vertical, FlexPanel.classes.childSpacingLarge, 'page-container-wide');
        let header = document.createElement('h2');
        header.textContent = 'Bans';
        let helpSection = new HelpSectionView();
        let formSection = this.buildAddBanForm();
        let tableSection = this.buildTableCollapse();
        panel.append(header, helpSection.root, formSection, tableSection);
        this._root = panel;
    }
    buildAddBanForm() {
        let addButton = new Button('Confirm Ban', Button.classes.link)
            .setCommand(this._bansViewModel.addBanCommand);
        addButton.style.width = 'min-content';
        let form = new VirtualForm(this._bansViewModel, [
            new TextField('username', 'Username:').setTooltip('The name of the player to ban.'),
            new TextareaField('reason', 'Reason:').setTooltip('The reason for banning the player'),
            new TextField('admin', 'Admin:').setTooltip('The name of the admin who performed the ban.'),
            new DateField('date', 'Date:').setTooltip('The date the ban took place.'),
            new TimeField('time', 'Time:').setTooltip('The time the ban took place'),
            new CheckboxField('synchronizeWithServers', 'Synchronize with Servers').setTooltip('If the added/removed ban should be sent to running servers.'),
            new Field(addButton)
        ]);
        form.isHorizontal = true;
        form.root.style.fontSize = '1rem';
        form.root.style.margin = '0 1.5rem';
        let header = document.createElement('div');
        let thumbtack = document.createElement('i');
        thumbtack.classList.add('fas', 'fa-thumbtack');
        let toggleButton = new ToggleButton(thumbtack);
        toggleButton.setTooltip('Pin the form to keep it in view.');
        toggleButton.style.marginRight = '0.5em';
        header.append(toggleButton);
        header.append('Add Ban');
        let formCollapse = new Collapse(header, form.root);
        formCollapse.open = true;
        formCollapse.classList.add('section');
        toggleButton.onToggle(state => {
            if (state) {
                formCollapse.style.top = 3.5 + 'rem';
                formCollapse.style.position = 'sticky';
                formCollapse.style.zIndex = '20';
            }
            else {
                formCollapse.style.top = '';
                formCollapse.style.position = '';
            }
        });
        return formCollapse;
    }
    buildTableCollapse() {
        let header = document.createElement('h4');
        this._bansViewModel.bind('banListHeader', (text) => header.innerText = text);
        let table = this.buildTable();
        let tableCollapse = new Collapse(header, table);
        tableCollapse.open = true;
        tableCollapse.classList.add('section');
        return tableCollapse;
    }
    buildTable() {
        let removeCellBuilder = (ban) => {
            return new Button('Remove', Button.classes.danger)
                .setCommand(this._bansViewModel.removeBanCommand)
                .setCommandParameter(ban);
        };
        let table = new Table(this._bansViewModel.bans, [
            new TextColumn('Username'),
            new TextColumn('Reason'),
            new TextColumn('Admin'),
            new ColumnTemplate()
                .setProperty('DateTime')
                .setHeader(() => 'Date Time')
                .setCell(date => Utils.formatDate(date)),
            new ColumnTemplate()
                .setHeader((headerCell) => {
                headerCell.style.minWidth = '0';
                return 'Remove';
            })
                .setCell(removeCellBuilder)
                .setSortingDisabled(true)
        ], event => this._bansViewModel.updateFormFromBan(event.item));
        table.classList.add('th-min-width-normal');
        table.style.fontSize = '1rem';
        table.style.fontWeight = 'normal';
        table.style.lineHeight = '1.5em';
        table.style.width = '100%';
        let tableContainer = document.createElement('div');
        tableContainer.style.overflowX = 'auto';
        tableContainer.style.margin = '0 1.5rem 1rem 1.5rem';
        tableContainer.append(table);
        return tableContainer;
    }
}
//# sourceMappingURL=bansView.js.map