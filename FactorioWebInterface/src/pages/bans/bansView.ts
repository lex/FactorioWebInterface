import { VirtualComponent } from "../../components/virtualComponent";
import { BansViewModel } from "./bansViewModel";
import { Collapse } from "../../components/collapse";
import { Table, ColumnTemplate, TextColumn } from "../../components/table";
import { Ban } from "./bansService";
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

export class BansView extends VirtualComponent {
    private _bansViewModel: BansViewModel;

    constructor(bansViewModel: BansViewModel) {
        super();

        this._bansViewModel = bansViewModel;
        this._bansViewModel.admin = (document.getElementById('_username') as HTMLInputElement).value;
        bansViewModel.onError((error) => alert(error));

        let panel = document.createElement('div');
        this._root = panel;

        panel.append(this.buildAddBanForm());
        panel.append(this.buildTableCollapse());
    }

    private buildAddBanForm() {
        let addButton = new Button('Confirm Ban', Button.classes.link);
        addButton.style.width = 'min-content';
        addButton.onClick(() => this._bansViewModel.addBan());

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
        formCollapse.classList.add('is-4', 'border', 'header');
        formCollapse.style.marginTop = '2rem';

        toggleButton.onToggle(state => {
            if (state) {
                formCollapse.style.top = 3.5 + 'rem';
                formCollapse.style.position = 'sticky';
                formCollapse.style.zIndex = '20';
            } else {
                formCollapse.style.top = '';
                formCollapse.style.position = '';
            }
        });

        return formCollapse;
    }

    private buildTableCollapse(): Node {
        let header = document.createElement('h4');
        this._bansViewModel.bind('banListHeader', (text) => header.innerText = text);

        let table = this.buildTable();

        let tableCollapse = new Collapse(header, table)
        tableCollapse.open = true;
        tableCollapse.classList.add('is-4', 'border');
        tableCollapse.style.marginTop = '2rem';

        return tableCollapse;
    }

    private buildTable(): Node {
        let removeCellBuilder = (ban: Ban) => {
            let button = new Button('Remove', Button.classes.danger);
            button.onClick(() => this._bansViewModel.removeAdmin(ban));

            return button;
        }

        let dateTimeColumn = new ColumnTemplate()
            .setProperty('DateTime')
            .setHeader(() => 'Date Time')
            .setCell(date => Utils.formatDate(date));

        let table = new Table<Ban>(this._bansViewModel.bans, [
            new TextColumn('Username'),
            new TextColumn('Reason'),
            new TextColumn('Admin'),
            dateTimeColumn,
            new ColumnTemplate()
                .setHeader((headerCell) => {
                    headerCell.style.minWidth = '0';
                    return 'Remove';
                })
                .setCell(removeCellBuilder)
                .setSortingDisabled(true)
        ],
            event => this._bansViewModel.updateFormFromBan(event.item));
        table.sortBy(dateTimeColumn, false);
        table.classList.add('th-min-width-normal');
        table.style.fontSize = '1rem';
        table.style.width = '100%';

        let tableContainer = document.createElement('div');
        tableContainer.style.overflowX = 'auto';
        tableContainer.style.margin = '0 1.5rem 1rem 1.5rem';
        tableContainer.append(table);

        return tableContainer;
    }
}