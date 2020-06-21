import { VirtualComponent } from "../../components/virtualComponent";
import { ModPackFilesViewModel } from "./modPackFilesViewModel";
import { Collapse } from "../../components/collapse";
import { Table, DateTimeColumn, MultiSelectColumn, ColumnTemplate } from "../../components/table";
import { Utils } from "../../ts/utils";
import { ModPackFileMetaData } from "../servers/serversTypes";
import { ComparatorHelper } from "../../utils/comparatorHelper";

class ModPackFileNameColumn extends ColumnTemplate<ModPackFileMetaData>{
    constructor(modPackFilesViewModel: ModPackFilesViewModel) {
        super();

        this.property = 'Name';

        this.cell = (name: string) => {
            let link = document.createElement('a') as HTMLAnchorElement;
            link.innerText = name;
            link.href = `/admin/mods?handler=file&modPack=${encodeURIComponent(modPackFilesViewModel.selectedModPack)}&fileName=${encodeURIComponent(name)}`;
            link.onclick = event => event.stopPropagation();

            return link;
        }

        this.comparator = ComparatorHelper.buildStringComparatorForProperty(this.property);
    }
}

export class ModPackFilesView extends VirtualComponent {
    constructor(modPackFilesViewModel: ModPackFilesViewModel) {
        super();

        let header = document.createElement('h4');
        modPackFilesViewModel.bind('title', text => header.textContent = text);

        let table = new Table(modPackFilesViewModel.files, [
            new MultiSelectColumn(),
            new ModPackFileNameColumn(modPackFilesViewModel),
            new DateTimeColumn('LastModifiedTime')
                .setHeader(() => 'Last Modified Time'),
            { property: 'Size', cell: (value) => Utils.bytesToSize(value) }
        ]);
        table.classList.add('th-min-width-normal');
        table.style.fontSize = '1rem';
        table.style.fontWeight = 'normal';
        table.style.width = '100%';

        let tableContainer = document.createElement('div');
        tableContainer.style.overflowX = 'auto';
        tableContainer.style.margin = '0 1.5rem 1rem 1.5rem';
        tableContainer.style.lineHeight = '1.5';
        tableContainer.append(table);

        let collapse = new Collapse(header, tableContainer);
        collapse.open = true;
        collapse.classList.add('is-4', 'border', 'header');
        collapse.style.marginTop = '2rem';
        this._root = collapse;
    }
}