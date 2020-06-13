import { VirtualComponent } from "../../components/virtualComponent";
import { Table, TextColumn } from "../../components/table";
import { StackPanel } from "../../components/stackPanel";
import { Select } from "../../components/select";
import { Button } from "../../components/button";
export class DataSetView extends VirtualComponent {
    constructor(dataSetViewModel) {
        super();
        this._dataSetViewModel = dataSetViewModel;
        let view = document.createElement('div');
        view.classList.add('border');
        view.style.marginTop = '2rem';
        view.style.padding = '1rem 2rem';
        this._root = view;
        let panel = new StackPanel(StackPanel.direction.row);
        view.append(panel);
        let header = document.createElement('h4');
        dataSetViewModel.bind('header', (value) => header.innerText = value);
        panel.appendChild(header);
        let select = new Select(this._dataSetViewModel.dataSetsOptions);
        select.style.marginLeft = 'auto';
        select.style.marginRight = '0.25rem';
        panel.append(select);
        let button = new Button('Refresh Data Sets', Button.classes.link);
        button.onClick(() => this._dataSetViewModel.refreshDataSets());
        panel.appendChild(button);
        let tableContainer = document.createElement('div');
        tableContainer.style.overflowX = 'auto';
        view.append(tableContainer);
        let table = new Table(dataSetViewModel.entries, [
            new TextColumn('Key')
                .setHeader((headerCell) => {
                headerCell.style.width = '16.67%';
                return 'Key';
            }),
            new TextColumn('Value')
        ], (event) => dataSetViewModel.updateFormFromEntry(event.item));
        table.style.width = '100%';
        table.style.marginTop = '1rem';
        tableContainer.appendChild(table);
    }
}
//# sourceMappingURL=dataSetView.js.map