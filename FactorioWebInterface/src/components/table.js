import "./table.ts.less";
import { CollectionView, CollectionViewChangeType } from "../utils/collectionView";
import { ComparatorHelper } from "../utils/comparatorHelper";
import { Utils } from "../ts/utils";
import { EventListener } from "../utils/eventListener";
import { Tooltip } from "./tooltip";
import { Observable } from "../utils/observable";
export class TableRow extends HTMLTableRowElement {
    constructor(_box) {
        super();
        this._box = _box;
    }
    get item() {
        return this._box.value;
    }
    get box() {
        return this._box;
    }
    get row() {
        return this;
    }
}
customElements.define('a-tr', TableRow, { extends: 'tr' });
export class Table extends HTMLTableElement {
    constructor(source, columns, rowClick) {
        super();
        if (source instanceof CollectionView) {
            this._source = source;
        }
        else {
            this._source = new CollectionView(source);
        }
        this._source.sortChanged((event) => this.updateHeaderSortDisplay(event));
        this._columns = columns;
        let rowClickObservable = new Observable();
        this._rowClickObservable = rowClickObservable;
        if (rowClick != null) {
            this._rowClickObservable.subscribe(rowClick);
        }
        let self = this;
        this._rowClickHandler = function () {
            let row = this;
            self._rowClickObservable.raise(row);
        };
        let head = document.createElement('thead');
        this.appendChild(head);
        this._headers = document.createElement('tr');
        head.appendChild(this._headers);
        this._body = document.createElement('tbody');
        this.appendChild(this._body);
        this.build();
    }
    get source() {
        return this._source;
    }
    updateHeaderSortDisplay(sortSpecifications) {
        for (let cell of this._headers.cells) {
            cell.removeAttribute('sort');
        }
        for (let sortSpec of sortSpecifications) {
            let sortId = sortSpec.sortId === undefined ? sortSpec.property : sortSpec.sortId;
            let cell = this._sortIdMap.get(sortId);
            if (cell == null) {
                continue;
            }
            cell.setAttribute('sort', sortSpec.ascending ? 'ascending' : 'descending');
        }
    }
    buildHeaders() {
        this._headers.innerHTML = '';
        this._sortIdMap = new Map();
        for (let i = 0; i < this._columns.length; i++) {
            let column = this._columns[i];
            let headerCell = document.createElement('th');
            let header = column.header;
            if (header == null) {
                headerCell.append(column.property || '');
            }
            else {
                let node = header(headerCell, this);
                headerCell.append(node);
            }
            if (column.sortingDisabled === true) {
                headerCell.setAttribute('sortingDisabled', '');
            }
            else {
                let sortId = this.getSortId(column);
                this._sortIdMap.set(sortId, headerCell);
                headerCell.addEventListener('click', () => this.onHeaderClick(column));
            }
            this._headers.appendChild(headerCell);
        }
        this.updateHeaderSortDisplay(this._source.sortSpecifications);
    }
    buildCell(row, entry, index) {
        let template = this._columns[index];
        let data = entry.value;
        let property = template.property;
        let propertyData = property == null ? data : data[property];
        let cell = row.cells[index];
        if (cell == null) {
            cell = document.createElement('td');
            row.appendChild(cell);
        }
        let cellBuilder = template.cell || this.textCellBuilder;
        cell.append(cellBuilder(propertyData, entry, this));
    }
    buildRow(box) {
        let row = new TableRow(box);
        this._rowMap.set(box, row);
        for (let index = 0; index < this._columns.length; index++) {
            this.buildCell(row, box, index);
        }
        if (this._rowClickObservable.subscriberCount > 0) {
            this.addRowClickHandler(box, row);
        }
    }
    addRowClickHandler(box, row) {
        row.addEventListener('click', this._rowClickHandler);
    }
    buildRows() {
        this._rowMap = new Map();
        for (let data of this._source.values) {
            this.buildRow(data);
        }
    }
    build() {
        this._source.subscribe(event => this.update(event));
        this.buildHeaders();
        this.buildRows();
        this.doReorder();
    }
    textCellBuilder(item) {
        return item + '';
    }
    onHeaderClick(column) {
        let sortId = this.getSortId(column);
        let cell = this._sortIdMap.get(sortId);
        let sortDirection = cell.getAttribute('sort');
        let ascending = sortDirection !== 'ascending';
        this.sortBy(column, ascending);
    }
    getSortId(column) {
        let sortId;
        if (column.getSortSpecification != null) {
            sortId = column.getSortSpecification(this).sortId;
        }
        if (sortId == null) {
            sortId = column.sortId === undefined ? column.property : column.sortId;
        }
        return sortId;
    }
    sortBy(column, ascending = true) {
        let sortSpec;
        if (column.getSortSpecification != null) {
            sortSpec = column.getSortSpecification(this);
        }
        else {
            let property = column.property;
            let comparator = column.comparator;
            sortSpec = {
                property: property,
                sortId: column.sortId,
                ascendingComparator: comparator
            };
        }
        sortSpec.ascending = ascending;
        this._source.sortBy(sortSpec);
    }
    doAdd() {
        for (let row of this._source.values) {
            this.buildRow(row);
        }
    }
    doReset() {
        var _a;
        (_a = this._rowMap) === null || _a === void 0 ? void 0 : _a.clear();
        this.doAdd();
        this.doReorder();
    }
    doRemove(rowEntries) {
        let rowMap = this._rowMap;
        for (let entry of rowEntries) {
            let oldRow = rowMap.get(entry);
            if (oldRow !== undefined) {
                rowMap.delete(entry);
                oldRow.remove();
            }
        }
    }
    doUpdate(rowEntries) {
        let rowMap = this._rowMap;
        for (let entry of rowEntries) {
            let row = rowMap.get(entry);
            if (row === undefined) {
                this.buildRow(entry);
            }
            else {
                row.innerHTML = '';
                for (let i = 0; i < this._columns.length; i++) {
                    this.buildCell(row, entry, i);
                }
            }
        }
    }
    doReorder() {
        let body = this._body;
        body.innerHTML = '';
        let rowMap = this._rowMap;
        for (let entry of this._source.values) {
            let row = rowMap.get(entry);
            body.appendChild(row);
        }
    }
    update(collectionChangedData) {
        switch (collectionChangedData.type) {
            case CollectionViewChangeType.Reset:
                this.doReset();
                break;
            case CollectionViewChangeType.Reorder:
                this.doReorder();
                break;
            case CollectionViewChangeType.Add:
                this.doUpdate(collectionChangedData.items);
                break;
            case CollectionViewChangeType.Remove:
                this.doRemove(collectionChangedData.items);
                break;
            default:
                break;
        }
    }
    onRowClick(callback) {
        if (this._rowClickObservable.subscriberCount === 0) {
            for (let entry of this._rowMap) {
                this.addRowClickHandler(entry[0], entry[1]);
            }
        }
        let unsub = this._rowClickObservable.subscribe(callback);
        return (() => {
            unsub();
            if (this._rowClickObservable.subscriberCount !== 0) {
                return;
            }
            for (let entry of this._rowMap) {
                entry[1].removeEventListener('click', this._rowClickHandler);
            }
        });
    }
    connectedCallback() {
        for (let column of this._columns) {
            if (column.connectedCallback != null) {
                column.connectedCallback(this);
            }
        }
    }
    disconnectedCallback() {
        for (let column of this._columns) {
            if (column.disconnectedCallback != null) {
                column.disconnectedCallback(this);
            }
        }
    }
}
customElements.define('a-table', Table, { extends: 'table' });
export class ColumnTemplate {
    setProperty(property) {
        this.property = property;
        return this;
    }
    setHeader(header) {
        this.header = header;
        return this;
    }
    setCell(cell) {
        this.cell = cell;
        return this;
    }
    setComparator(comparator) {
        this.comparator = comparator;
        return this;
    }
    setSortId(sortId) {
        this.sortId = sortId;
        return this;
    }
    setSortingDisabled(sortingDisabled) {
        this.sortingDisabled = sortingDisabled;
        return this;
    }
}
export class TextColumn extends ColumnTemplate {
    constructor(property) {
        super();
        this.caseSensitive = false;
        this.property = property;
        this.cell = TextColumn.textCellBuilder;
    }
    static textCellBuilder(item) {
        return item + '';
    }
    setCaseSensitive(caseSensitive) {
        this.caseSensitive = caseSensitive;
        return this;
    }
    get comparator() {
        if (this._comparator == null) {
            if (this.property) {
                this._comparator = ComparatorHelper.buildStringComparatorForProperty(this.property, this.caseSensitive);
            }
            else {
                this._comparator = ComparatorHelper.buildStringComparator(this.caseSensitive);
            }
        }
        return this._comparator;
    }
    set comparator(comparator) {
        this._comparator = comparator;
    }
}
export class DateTimeColumn extends ColumnTemplate {
    static cell(item) {
        return Utils.formatDate(item);
    }
    constructor(property) {
        super();
        this.property = property;
        this.cell = DateTimeColumn.cell;
    }
}
export class MultiSelectColumn extends ColumnTemplate {
    constructor(disableRowClick) {
        super();
        this.disableRowClick = disableRowClick;
        this.cell = MultiSelectColumn.cell;
        this.header = MultiSelectColumn.header;
    }
    static cell(item, box, table) {
        let source = table.source;
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = source.isSelected(box);
        EventListener.onClick(checkbox, (event) => {
            event.stopPropagation();
            source.setSelected(box, checkbox.checked);
        });
        return checkbox;
    }
    static header(headerCell, table) {
        let source = table.source;
        let container = document.createElement('span');
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        EventListener.onClick(checkbox, (event) => {
            event.stopPropagation();
            if (checkbox.checked) {
                source.selectAll();
            }
            else {
                source.unSelectAll();
            }
        });
        container.append(checkbox);
        let tooltip = new Tooltip('Toggle select all.');
        container.append(tooltip);
        headerCell.style.width = '3.5em';
        return container;
    }
    connectedCallback(table) {
        if (this.disableRowClick) {
            return;
        }
        this._rowClickSubscription = table.onRowClick(event => {
            let source = table.source;
            let box = event.box;
            source.setSelected(box, !source.isSelected(box));
        });
    }
    disconnectedCallback(table) {
        Observable.unSubscribe(this._rowClickSubscription);
    }
    getSortSpecification(table) {
        return { ascendingBoxComparator: table.source.selectedComparatorBuilder(), sortId: table.source.selectedSortId };
    }
}
export class SingleSelectColumn extends ColumnTemplate {
    constructor(disableRowClick) {
        super();
        this.disableRowClick = disableRowClick;
        this.cell = SingleSelectColumn.cell;
        this.header = SingleSelectColumn.header;
    }
    static cell(item, box, table) {
        let source = table.source;
        let radio = document.createElement('input');
        radio.type = 'radio';
        radio.checked = source.isSelected(box);
        EventListener.onClick(radio, (event) => {
            event.stopPropagation();
            if (source.isSelected(box)) {
                source.unSelectAll();
            }
            else {
                source.setSingleSelected(box);
            }
        });
        return radio;
    }
    static header(headerCell, table) {
        let source = table.source;
        let container = document.createElement('span');
        let radio = document.createElement('input');
        radio.type = 'radio';
        EventListener.onClick(radio, (event) => {
            event.stopPropagation();
            radio.checked = false;
            source.unSelectAll();
        });
        container.append(radio);
        let tooltip = new Tooltip('Clear selection.');
        container.append(tooltip);
        headerCell.style.width = '3.5em';
        return container;
    }
    connectedCallback(table) {
        if (this.disableRowClick) {
            return;
        }
        this._rowClickSubscription = table.onRowClick(event => {
            let source = table.source;
            let box = event.box;
            if (source.isSelected(box)) {
                source.unSelectAll();
            }
            else {
                source.setSingleSelected(box);
            }
        });
    }
    disconnectedCallback(table) {
        Observable.unSubscribe(this._rowClickSubscription);
    }
    getSortSpecification(table) {
        return { ascendingBoxComparator: table.source.selectedComparatorBuilder(), sortId: table.source.selectedSortId };
    }
}
//# sourceMappingURL=table.js.map