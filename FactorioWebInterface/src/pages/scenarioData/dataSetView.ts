import { VirtualComponent } from "../../components/virtualComponent";
import { DataSetViewModel } from "./dataSetViewModel";
import { Table, TextColumn } from "../../components/table";
import { FlexPanel } from "../../components/flexPanel";
import { Select } from "../../components/select";
import { Button } from "../../components/button";
import { ObservableObjectBindingSource } from "../../utils/bindingSource";
import { Collapse } from "../../components/collapse";
import { Label } from "../../components/label";

export class DataSetView extends VirtualComponent {
    private _dataSetViewModel: DataSetViewModel;

    constructor(dataSetViewModel: DataSetViewModel) {
        super();

        this._dataSetViewModel = dataSetViewModel;

        let headerPanel = new FlexPanel(FlexPanel.classes.horizontal, FlexPanel.classes.spacingNone, FlexPanel.classes.childSpacing, FlexPanel.classes.grow);

        let header = new Label()
            .bindContent(new ObservableObjectBindingSource(dataSetViewModel, 'header'))
            .addClasses('is-4', 'header');
        header.style.alignSelf = 'center';

        let select = new Select(this._dataSetViewModel.dataSets)
            .bindPlaceholder(new ObservableObjectBindingSource(dataSetViewModel, 'placeholder'))
            .bindIsLoading(new ObservableObjectBindingSource(dataSetViewModel, 'fetchingDataSets'));
        select.style.marginLeft = 'auto';
        select.onclick = event => event.stopPropagation();
        select.style.minWidth = '10em';
        select.style.fontSize = '1rem';
        select.style.fontWeight = 'normal';

        let button = new Button('Refresh Data Sets', Button.classes.link)
            .setCommand(this._dataSetViewModel.refreshDataSetsCommand);
        button.style.fontSize = '1rem';
        button.style.fontWeight = 'normal';
        button.style.marginRight = '1rem';
        headerPanel.append(header, select, button);

        let tableContainer = document.createElement('div');
        tableContainer.style.overflowX = 'auto';
        tableContainer.style.margin = '0 1.5rem 1rem 1.5rem';

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
        table.style.fontSize = '1rem';
        table.style.fontWeight = 'normal';
        table.style.lineHeight = '1.5em';
        tableContainer.appendChild(table);

        let collapse = new Collapse(headerPanel, tableContainer)
            .addClasses('section')
            .setOpen(true);

        this._root = collapse;
    }
}