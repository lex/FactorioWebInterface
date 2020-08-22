import { ScenariosViewModel } from "./scenariosViewModel";
import { Table, SingleSelectColumn, TextColumn, DateTimeColumn } from "../../components/table";
import { VirtualComponent } from "../../components/virtualComponent";
import { Collapse } from "../../components/collapse";
import { ObservableObjectBindingSource } from "../../utils/binding/module";
import { Label } from "../../components/label";

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

        let header = new Label()
            .bindContent(new ObservableObjectBindingSource(scenariosViewModel, 'header'))
            .addClasses('is-4', 'header');
        header.style.wordBreak = 'break-all';

        let collapse = new Collapse(header, table);
        collapse.open = true;
        collapse.classList.add('section');
        this._root = collapse;
    }
}