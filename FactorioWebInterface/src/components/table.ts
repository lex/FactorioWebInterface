import "./table.ts.less";
import { ObservableCollection } from "../utils/observableCollection";
import { CollectionView, SortSpecification, CollectionViewChangedData, CollectionViewChangeType } from "../utils/collectionView";
import { Box } from "../utils/box";
import { ComparatorHelper } from "../utils/comparatorHelper";
import { Utils } from "../ts/utils";
import { EventListener } from "../utils/eventListener";
import { Tooltip } from "./tooltip";
import { Observable, IObservable } from "../utils/observable";
import { Input } from "./input";

export interface rowClickEventArgs<T> {
    readonly item: T;
    readonly box: Box<T>;
    readonly row: TableRow<T>;
}

export class TableRow<T = any> extends HTMLTableRowElement implements rowClickEventArgs<T> {
    get item() {
        return this._box.value;
    }

    get box() {
        return this._box;
    }

    get row() {
        return this;
    }

    constructor(private _box?: Box<T>) {
        super();
    }
}

customElements.define('a-tr', TableRow, { extends: 'tr' });

export class Table<T = any> extends HTMLTableElement {
    private _source: CollectionView<T>;
    private _columns: IColumnTemplate[];
    private _rowClickHandler: (this: HTMLTableRowElement) => void;
    private _rowClickObservable: Observable<rowClickEventArgs<T>>;

    private _headers: HTMLTableRowElement;
    private _body: HTMLTableSectionElement;

    private _rowMap: Map<Box<T>, TableRow<T>>;
    private _sortIdMap: Map<any, HTMLTableHeaderCellElement>;

    get source(): CollectionView<T> {
        return this._source;
    }

    constructor(source?: ObservableCollection<T> | CollectionView<T>, columns?: IColumnTemplate<T>[], rowClick?: (event: rowClickEventArgs<T>) => void) {
        super();

        if (source instanceof CollectionView) {
            this._source = source;
        } else {
            this._source = new CollectionView(source);
        }
        this._source.sortChanged((event) => this.updateHeaderSortDisplay(event));

        this._columns = columns;

        let rowClickObservable = new Observable<rowClickEventArgs<T>>();
        this._rowClickObservable = rowClickObservable;
        if (rowClick != null) {
            this._rowClickObservable.subscribe(rowClick);
        }

        let self = this;
        this._rowClickHandler = function () {
            let row = this as TableRow<T>;
            self._rowClickObservable.raise(row);
        }

        let head = document.createElement('thead');
        this.appendChild(head);

        this._headers = document.createElement('tr');
        head.appendChild(this._headers);

        this._body = document.createElement('tbody');
        this.appendChild(this._body);

        this.build();
    }

    private updateHeaderSortDisplay(sortSpecifications: SortSpecification<T>[]) {
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

    private buildHeaders() {
        this._headers.innerHTML = '';
        this._sortIdMap = new Map();

        for (let i = 0; i < this._columns.length; i++) {
            let column = this._columns[i];

            let headerCell = document.createElement('th');
            let header = column.header;
            if (header == null) {
                headerCell.append(column.property || '');
            } else {
                let node = header(headerCell, this);
                headerCell.append(node);
            }

            if (column.sortingDisabled === true) {
                headerCell.setAttribute('sortingDisabled', '');
            } else {

                let sortId = this.getSortId(column);
                this._sortIdMap.set(sortId, headerCell);

                headerCell.addEventListener('click', () => this.onHeaderClick(column));
            }

            this._headers.appendChild(headerCell);
        }

        this.updateHeaderSortDisplay(this._source.sortSpecifications);
    }

    private buildCell(row: HTMLTableRowElement, entry: Box<T>, index: number) {
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
        cell.append(cellBuilder(propertyData, entry, this))
    }

    private buildRow(box: Box<T>) {
        let row = new TableRow(box);

        this._rowMap.set(box, row);

        for (let index = 0; index < this._columns.length; index++) {
            this.buildCell(row, box, index);
        }

        if (this._rowClickObservable.subscriberCount > 0) {
            this.addRowClickHandler(box, row);
        }
    }

    private addRowClickHandler(box: Box<T>, row: HTMLTableRowElement) {
        row.addEventListener('click', this._rowClickHandler);
    }

    private buildRows() {
        this._rowMap = new Map();

        for (let data of this._source.values) {
            this.buildRow(data);
        }
    }

    private build() {
        this._source.subscribe(event => this.update(event));
        this.buildHeaders();
        this.buildRows();
        this.doReorder();
    }

    private textCellBuilder(item: any): string {
        return item + '';
    }

    private onHeaderClick(column: IColumnTemplate<T>) {
        let sortId = this.getSortId(column);

        let cell = this._sortIdMap.get(sortId);
        let sortDirection = cell.getAttribute('sort');
        let ascending = sortDirection !== 'ascending';

        this.sortBy(column, ascending);
    }

    private getSortId(column: IColumnTemplate<T>) {
        let sortId: any;
        if (column.getSortSpecification != null) {
            sortId = column.getSortSpecification(this).sortId
        }
        if (sortId == null) {
            sortId = column.sortId === undefined ? column.property : column.sortId;
        }

        return sortId;
    }

    sortBy(column: IColumnTemplate, ascending: boolean = true): void {
        let sortSpec: SortSpecification<T>;

        if (column.getSortSpecification != null) {
            sortSpec = column.getSortSpecification(this);
        } else {
            let property = column.property;
            let comparator = column.comparator;

            sortSpec = {
                property: property,
                sortId: column.sortId,
                ascendingComparator: comparator
            };
        }

        sortSpec.ascending = ascending
        this._source.sortBy(sortSpec);
    }

    private doAdd() {
        for (let row of this._source.values) {
            this.buildRow(row);
        }
    }

    private doReset(rowEntries: Box<T>[]) {
        this._rowMap?.clear();

        if (rowEntries == null) {
            this.doAdd();
        } else {
            this.doUpdate(rowEntries);
        }

        this.doReorder();
    }

    private doRemove(rowEntries: Box<T>[]) {
        let rowMap = this._rowMap;

        for (let entry of rowEntries) {
            let oldRow = rowMap.get(entry);
            if (oldRow !== undefined) {
                rowMap.delete(entry);
                oldRow.remove();
            }
        }
    }

    private doUpdate(rowEntries: Box<T>[]) {
        let rowMap = this._rowMap;

        for (let entry of rowEntries) {
            let row = rowMap.get(entry);
            if (row === undefined) {
                this.buildRow(entry);
            } else {
                row.innerHTML = '';

                for (let i = 0; i < this._columns.length; i++) {
                    this.buildCell(row, entry, i);
                }
            }
        }
    }

    private doReorder() {
        let body = this._body;
        body.innerHTML = '';

        let rowMap = this._rowMap;

        for (let entry of this._source.values) {
            let row = rowMap.get(entry);
            body.appendChild(row);
        }
    }

    update(collectionChangedData: CollectionViewChangedData<T>): void {
        switch (collectionChangedData.type) {
            case CollectionViewChangeType.Reset:
                this.doReset(collectionChangedData.items);
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

    onRowClick(callback: (event: rowClickEventArgs<T>) => void): () => void {
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

export interface IColumnTemplate<T = any> {
    property?: string;
    header?: (headerCell?: HTMLTableHeaderCellElement, table?: Table<T>) => Node | string;
    cell?: (value: any, box?: Box<T>, table?: Table<T>) => Node | string;
    comparator?: (a: any, b: any) => number;
    sortId?: any;
    sortingDisabled?: boolean;
    getSortSpecification?(table?: Table<T>): SortSpecification<T>;
    connectedCallback?(table?: Table<T>): void;
    disconnectedCallback?(table?: Table<T>): void;
}

export class ColumnTemplate<T = any> implements IColumnTemplate<T>{
    property: string;
    header: (headerCell?: HTMLTableHeaderCellElement, table?: Table<T>) => Node | string;
    cell: (value: any, box?: Box<T>, table?: Table<T>) => Node | string;
    comparator: (a: any, b: any) => number;
    sortId: any;
    sortingDisabled: boolean;

    setProperty(property: string): this {
        this.property = property;
        return this;
    }

    setHeader(header: (headerCell?: HTMLTableHeaderCellElement, table?: Table<T>) => Node | string): this {
        this.header = header;
        return this;
    }

    setCell(cell: (value: any, box?: Box<T>, table?: Table<T>) => Node | string): this {
        this.cell = cell;
        return this;
    }

    setComparator(comparator: (a: any, b: any) => number): this {
        this.comparator = comparator;
        return this;
    }

    setSortId(sortId: any): this {
        this.sortId = sortId;
        return this;
    }

    setSortingDisabled(sortingDisabled: boolean): this {
        this.sortingDisabled = sortingDisabled;
        return this;
    }
}

export class TextColumn<T = any> extends ColumnTemplate<T> {
    private static textCellBuilder(item: any): string {
        return item + '';
    }

    private _comparator: (a: any, b: any) => number;

    caseSensitive = false;

    setCaseSensitive(caseSensitive: boolean): this {
        this.caseSensitive = caseSensitive;
        return this;
    }

    get comparator(): (a: any, b: any) => number {
        if (this._comparator == null) {
            if (this.property) {
                this._comparator = ComparatorHelper.buildStringComparatorForProperty(this.property, this.caseSensitive);
            } else {
                this._comparator = ComparatorHelper.buildStringComparator(this.caseSensitive);
            }
        }

        return this._comparator;
    }
    set comparator(comparator: (a: any, b: any) => number) {
        this._comparator = comparator
    }

    constructor(property?: string) {
        super();
        this.property = property;
        this.cell = TextColumn.textCellBuilder;
    }
}

export class DateTimeColumn<T = any> extends ColumnTemplate<T>{
    static cell(item: Date): string {
        return Utils.formatDate(item);
    }

    constructor(property?: string) {
        super();
        this.property = property;
        this.cell = DateTimeColumn.cell;
    }
}

export class MultiSelectColumn<T = any> extends ColumnTemplate<T>{
    static cell<T>(item: any, box: Box<T>, table: Table<T>): Node {
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

    static header<T>(headerCell?: HTMLTableHeaderCellElement, table?: Table<T>): Node {
        let source = table.source;

        let container = document.createElement('span');

        let checkbox = new Input();
        checkbox.type = 'checkbox';
        checkbox.setTooltip('Toggle select all.');
        EventListener.onClick(checkbox, (event: MouseEvent) => {
            event.stopPropagation();

            if (checkbox.checked) {
                source.selectAll();
            } else {
                source.unSelectAll();
            }
        });
        container.append(checkbox);

        headerCell.style.width = '3.5em'
        headerCell.style.minWidth = '0px';

        return container;
    }

    private _rowClickSubscription: () => void;

    constructor(private disableRowClick?: boolean) {
        super();

        this.cell = MultiSelectColumn.cell;
        this.header = MultiSelectColumn.header;
    }

    connectedCallback(table: Table<T>) {
        if (this.disableRowClick) {
            return;
        }

        this._rowClickSubscription = table.onRowClick(event => {
            let source = table.source;
            let box = event.box;

            source.setSelected(box, !source.isSelected(box));
        });
    }

    disconnectedCallback(table: Table<T>) {
        Observable.unSubscribe(this._rowClickSubscription);
    }

    getSortSpecification(table: Table<T>): SortSpecification<T> {
        return { ascendingBoxComparator: table.source.selectedComparatorBuilder(), sortId: table.source.selectedSortId };
    }
}

export class SingleSelectColumn<T = any> extends ColumnTemplate<T>{
    static cell<T>(item: any, box: Box<T>, table: Table<T>): Node {
        let source = table.source;

        let radio = document.createElement('input');
        radio.type = 'radio';
        radio.checked = source.isSelected(box);
        EventListener.onClick(radio, (event) => {
            event.stopPropagation();

            if (source.isSelected(box)) {
                source.unSelectAll();
            } else {
                source.setSingleSelected(box);
            }
        });

        return radio;
    }

    static header<T>(headerCell?: HTMLTableHeaderCellElement, table?: Table<T>): Node {
        let source = table.source;

        let container = document.createElement('span');

        let radio = new Input();
        radio.type = 'radio';
        radio.setTooltip('Clear selection.');
        EventListener.onClick(radio, (event: MouseEvent) => {
            event.stopPropagation();

            radio.checked = false;
            source.unSelectAll();
        });
        container.append(radio);

        headerCell.style.width = '3.5em'
        headerCell.style.minWidth = '0px';

        return container;
    }

    private _rowClickSubscription: () => void;

    constructor(private disableRowClick?: boolean) {
        super();

        this.cell = SingleSelectColumn.cell;
        this.header = SingleSelectColumn.header;
    }

    connectedCallback(table: Table<T>) {
        if (this.disableRowClick) {
            return;
        }

        this._rowClickSubscription = table.onRowClick(event => {
            let source = table.source;
            let box = event.box;

            if (source.isSelected(box)) {
                source.unSelectAll();
            } else {
                source.setSingleSelected(box);
            }
        });
    }

    disconnectedCallback(table: Table<T>) {
        Observable.unSubscribe(this._rowClickSubscription);
    }

    getSortSpecification(table: Table<T>): SortSpecification<T> {
        return { ascendingBoxComparator: table.source.selectedComparatorBuilder(), sortId: table.source.selectedSortId };
    }
}