import { Table, SingleSelectColumn, TextColumn, DateTimeColumn } from "../../components/table";
import { VirtualComponent } from "../../components/virtualComponent";
import { Collapse } from "../../components/collapse";
export class ModPacksView extends VirtualComponent {
    constructor(modPacksViewModel) {
        super();
        let table = new Table(modPacksViewModel.modPacks, [
            new SingleSelectColumn(),
            new TextColumn('Name'),
            new DateTimeColumn('LastModifiedTime').setHeader(() => 'Last Modified Time'),
        ]);
        table.style.fontSize = '1rem';
        table.style.fontWeight = 'normal';
        table.style.lineHeight = '1.5';
        table.style.width = 'calc(100% - 2rem)';
        table.style.margin = '0rem 1rem 0.67rem 1rem';
        let collapse = new Collapse(modPacksViewModel.header, table);
        modPacksViewModel.propertyChanged('header', text => collapse.setHeader(text));
        collapse.open = true;
        collapse.classList.add('is-4', 'border', 'header');
        collapse.style.marginTop = '1rem';
        this._root = collapse;
    }
}
//# sourceMappingURL=modPacksView.js.map