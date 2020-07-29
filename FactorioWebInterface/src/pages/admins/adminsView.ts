import { VirtualComponent } from "../../components/virtualComponent";
import { AdminsViewModel } from "./adminsViewModel";
import { Table, TextColumn, ColumnTemplate } from "../../components/table";
import { Button } from "../../components/button";
import { Collapse } from "../../components/collapse";
import { VirtualForm } from "../../components/virtualForm";
import { TextareaField } from "../../components/textareaField";
import { Field } from "../../components/field";
import { Admin } from "./adminsTypes";
import { FlexPanel } from "../../components/flexPanel";
import { HelpSectionView } from "./helpSectionView";
import { ToggleButton } from "../../components/toggleButton";

export class AdminsView extends VirtualComponent {
    private _adminsViewModel: AdminsViewModel;

    constructor(adminsViewModel: AdminsViewModel) {
        super();

        this._adminsViewModel = adminsViewModel;

        let panel = new FlexPanel(FlexPanel.classes.vertical, FlexPanel.classes.childSpacingLarge, 'page-container');

        let header = document.createElement('h2');
        header.textContent = 'In Game Admins';

        let helpSection = new HelpSectionView();
        let formSection = this.buildAddAdminsForm();
        let tableSection = this.buildTableCollapse();

        panel.append(header, helpSection.root, formSection, tableSection);
        this._root = panel;
    }

    private buildAddAdminsForm() {
        let addButton = new Button('Add', Button.classes.link)
            .setCommand(this._adminsViewModel.addAdminsCommand);
        addButton.style.width = 'min-content';

        let form = new VirtualForm(this._adminsViewModel, [
            new TextareaField('addAdminsText', 'Add in game admins (comma separated list):'),
            new Field(addButton)
        ]);
        form.root.style.fontSize = '1rem';
        form.root.style.margin = '0 1.5rem';

        let thumbtack = document.createElement('i');
        thumbtack.classList.add('fas', 'fa-thumbtack');
        let toggleButton = new ToggleButton(thumbtack);
        toggleButton.setTooltip('Pin the form to keep it in view.');
        toggleButton.style.marginRight = '0.5em';

        let header = document.createElement('div');
        header.append(toggleButton, 'Add Admins');

        let formCollapse = new Collapse(header, form.root);
        formCollapse.open = true;
        formCollapse.classList.add('section');

        toggleButton.onToggle(state => {
            if (state) {
                formCollapse.style.top = '3.5rem';
                formCollapse.style.position = 'sticky';
                formCollapse.style.zIndex = '20';
            } else {
                formCollapse.style.top = '';
                formCollapse.style.position = '';
            }
        });

        return formCollapse;
    }

    private buildTableCollapse() {
        let header = document.createElement('div');
        this._adminsViewModel.bind('adminListHeader', (text) => header.innerText = text);

        let table = this.buildTable();

        let tableCollapse = new Collapse(header, table)
        tableCollapse.open = true;
        tableCollapse.classList.add('section');

        return tableCollapse;
    }

    private buildTable(): Table<Admin> {
        let removeCellBuilder = ((admin: Admin) => {
            return new Button('Remove', Button.classes.danger)
                .setCommand(this._adminsViewModel.removeAdminCommand)
                .setCommandParameter(admin);
        });

        let table = new Table<Admin>(this._adminsViewModel.admins, [
            new TextColumn('Name'),
            new ColumnTemplate()
                .setHeader(() => 'Remove')
                .setCell(removeCellBuilder)
                .setSortingDisabled(true)
        ]);
        table.style.fontSize = '1rem';
        table.style.fontWeight = 'normal';
        table.style.marginLeft = '1.5rem';
        table.style.marginBottom = '1rem';

        return table;
    }
}