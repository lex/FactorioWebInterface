import { VirtualComponent } from "../../components/virtualComponent";
import { Collapse } from "../../components/collapse";
import { Table, DateTimeColumn, ColumnTemplate } from "../../components/table";
import { Utils } from "../../ts/utils";
import { ComparatorHelper } from "../../utils/comparatorHelper";
class LogFileNameColumn extends ColumnTemplate {
    constructor(handler) {
        super();
        this.property = 'Name';
        this.cell = (name, box) => {
            let file = box.value;
            let link = document.createElement('a');
            link.innerText = file.Name;
            link.href = `/admin/servers?handler=${encodeURIComponent(handler)}&directory=${encodeURIComponent(file.Directory)}&name=${encodeURIComponent(file.Name)}`;
            link.onclick = event => event.stopPropagation();
            return link;
        };
        this.comparator = ComparatorHelper.buildStringComparatorForProperty(this.property);
    }
}
export class LogFileView extends VirtualComponent {
    constructor(logFileViewModel) {
        super();
        let table = new Table(logFileViewModel.files, [
            new LogFileNameColumn(logFileViewModel.handler),
            new DateTimeColumn('LastModifiedTime').setHeader(() => 'Last Modified Time'),
            { property: 'Size', cell: (value) => Utils.bytesToSize(value) }
        ]);
        table.style.fontSize = '1rem';
        table.style.fontWeight = 'normal';
        table.style.lineHeight = '1.5';
        table.style.width = 'calc(100% - 2rem)';
        table.style.margin = '0rem 1rem 0.67rem 1rem';
        let collapse = new Collapse(logFileViewModel.header, table);
        logFileViewModel.propertyChanged('header', text => collapse.setHeader(text));
        collapse.open = true;
        collapse.classList.add('section');
        this._root = collapse;
    }
}
//# sourceMappingURL=logFileView.js.map