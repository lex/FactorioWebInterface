import { VirtualComponent } from "../../components/virtualComponent";
import { DataSetViewModel } from "./dataSetViewModel";
import { Table, TextColumn } from "../../components/table";
import { StackPanel } from "../../components/stackPanel";
import { Select } from "../../components/select";
import { Button } from "../../components/button";

export class DataSetView extends VirtualComponent {
    private _dataSetViewModel: DataSetViewModel;

    constructor(dataSetViewModel: DataSetViewModel) {
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
        header.innerText = dataSetViewModel.header;
        dataSetViewModel.propertyChanged('header', (value) => header.innerText = value);
        panel.appendChild(header);

        let select = new Select(this._dataSetViewModel.dataSetsOptions);
        select.onchange = (() => this._dataSetViewModel.setDataSet(select.selectedItem));
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
                    return 'Key'
                }),
            new TextColumn('Value')
        ],
            (event) => dataSetViewModel.updateFormFromEntry(event.item));
        table.style.width = '100%';
        table.style.marginTop = '1rem';
        tableContainer.appendChild(table);
    }
}