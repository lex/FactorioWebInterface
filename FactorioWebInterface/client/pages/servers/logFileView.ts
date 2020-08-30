import { VirtualComponent } from "../../components/virtualComponent";
import { Collapse } from "../../components/collapse";
import { Table, DateTimeColumn, MultiSelectColumn, ColumnTemplate } from "../../components/table";
import { Utils } from "../../ts/utils";
import { FileMetaData } from "./serversTypes";
import { Box } from "../../utils/box";
import { ComparatorHelper } from "../../utils/comparatorHelper";
import { LogFileViewModel } from "./logFileViewModel";
import { Label } from "../../components/label";
import { ObservableObjectBindingSource } from "../../utils/binding/module";

class LogFileNameColumn extends ColumnTemplate<string, FileMetaData>{
    constructor(handler: string) {
        super();

        this.property = 'Name';

        this.cell = (name: string, file: FileMetaData) => {
            let link = document.createElement('a') as HTMLAnchorElement;
            link.innerText = file.Name;
            link.href = `/admin/servers?handler=${encodeURIComponent(handler)}&directory=${encodeURIComponent(file.Directory)}&name=${encodeURIComponent(file.Name)}`;
            link.onclick = event => event.stopPropagation();

            return link;
        }

        this.comparator = ComparatorHelper.buildStringComparatorForProperty(this.property);
    }
}

export class LogFileView extends VirtualComponent {
    constructor(logFileViewModel: LogFileViewModel) {
        super();

        let table = new Table(logFileViewModel.files,
            [
                new LogFileNameColumn(logFileViewModel.handler),
                new DateTimeColumn('LastModifiedTime').setHeader(() => 'Last Modified Time'),
                { property: 'Size', cell: (value) => Utils.bytesToSize(value) }
            ]);
        table.style.fontSize = '1rem';
        table.style.fontWeight = 'normal';
        table.style.lineHeight = '1.5';
        table.style.width = 'calc(100% - 2rem)';
        table.style.margin = '0rem 1rem 0.67rem 1rem';

        let header = new Label()
            .bindContent(new ObservableObjectBindingSource(logFileViewModel, 'header'))
            .addClasses('is-4', 'header');
        header.style.wordBreak = 'break-all';

        let collapse = new Collapse(header, table);
        collapse.open = true;
        collapse.classList.add('section');
        this._root = collapse;
    }
}