import { ScenariosViewModel } from "./scenariosViewModel";
import { Table, SingleSelectColumn, TextColumn, DateTimeColumn } from "../../components/table";
import { VirtualComponent } from "../../components/virtualComponent";
import { Collapse } from "../../components/collapse";

export class ScenariosView extends VirtualComponent {
    constructor(scenariosViewModel: ScenariosViewModel) {
        super();

        let table = new Table(scenariosViewModel.scenarios,
            [
                new SingleSelectColumn(),
                new TextColumn('Name'),
                new DateTimeColumn('LastModifiedTime').setHeader(() => 'Last Modified Time'),
            ]);
        table.style.fontSize = '1rem';
        table.style.fontWeight = 'normal';
        table.style.lineHeight = '1.5';
        table.style.width = 'calc(100% - 2rem)';
        table.style.margin = '0rem 1rem 0.67rem 1rem';

        let collapse = new Collapse(scenariosViewModel.header, table);
        scenariosViewModel.propertyChanged('header', text => collapse.setHeader(text));
        collapse.open = true;
        collapse.classList.add('is-4', 'border', 'header');
        this._root = collapse;
    }
}