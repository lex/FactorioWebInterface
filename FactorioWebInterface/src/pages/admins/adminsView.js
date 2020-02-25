import { VirtualComponent } from "../../components/virtualComponent";
import { Table, TextColumn, ColumnTemplate } from "../../components/table";
import { Button } from "../../components/button";
import { Collapse } from "../../components/collapse";
import { VirtualForm } from "../../components/virtualForm";
import { TextareaField } from "../../components/textareaField";
import { Field } from "../../components/field";
export class AdminsView extends VirtualComponent {
    constructor(adminsViewModel) {
        super();
        this._adminsViewModel = adminsViewModel;
        adminsViewModel.onError((error) => alert(error));
        let panel = document.createElement('div');
        this._root = panel;
        panel.append(this.buildAddAdminsForm());
        panel.append(this.buildTableCollapse());
    }
    buildAddAdminsForm() {
        let addButton = new Button('Add', Button.classes.link);
        addButton.style.width = 'min-content';
        addButton.onClick(() => this._adminsViewModel.addAdmins());
        let form = new VirtualForm(this._adminsViewModel, [
            new TextareaField('addAdminsText', 'Add in game admins (comma seperated list):'),
            new Field(addButton)
        ]);
        form.root.style.fontSize = '1rem';
        form.root.style.margin = '0 1.5rem';
        let formCollapse = new Collapse('Add Admins', form.root);
        formCollapse.open = true;
        formCollapse.classList.add('is-3', 'border');
        formCollapse.style.marginTop = '3rem';
        return formCollapse;
    }
    buildTableCollapse() {
        let header = document.createElement('div');
        header.innerText = this._adminsViewModel.adminListHeader;
        this._adminsViewModel.propertyChanged('adminListHeader', (text) => header.innerText = text);
        let table = this.buildTable();
        let tableCollapse = new Collapse(header, table);
        tableCollapse.open = true;
        tableCollapse.classList.add('is-3', 'border');
        tableCollapse.style.marginTop = '3rem';
        return tableCollapse;
    }
    buildTable() {
        let removeCellBuilder = (admin) => {
            let button = new Button('Remove', Button.classes.danger);
            button.onClick((event) => {
                event.stopPropagation();
                this._adminsViewModel.removeAdmin(admin);
            });
            return button;
        };
        let nameColumn = new TextColumn('Name');
        let table = new Table(this._adminsViewModel.admins, [
            nameColumn,
            new ColumnTemplate()
                .setHeader(() => 'Remove')
                .setCell(removeCellBuilder)
                .setSortingDisabled(true)
        ]);
        table.sortBy(nameColumn);
        table.style.fontSize = '1rem';
        table.style.marginLeft = '1.5rem';
        table.style.marginBottom = '1rem';
        return table;
    }
}
//# sourceMappingURL=adminsView.js.map