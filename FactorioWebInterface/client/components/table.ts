import "./table.ts.less";
import { ComparatorHelper } from "../utils/comparatorHelper";
import { Utils } from "../ts/utils";
import { EventListener } from "../utils/eventListener";
import { Observable } from "../utils/observable";
import { Input } from "./input";
import { CollectionView, ObservableCollection, SortSpecification, CollectionViewChangedData, CollectionViewChangeType } from "../utils/collections/module";

export interface rowClickEventArgs<T> {
    readonly item: T;
    readonly row: TableRow<T>;
}

export class TableRow<T = any> extends HTMLTableRowElement implements rowClickEventArgs<T> {
    get item() {
        return this._item;
    }

    get row() {
        return this;
    }

    constructor(private _item?: T) {
        super();
    }
}

customElements.define('a-tr', TableRow, { extends: 'tr' });

export class Table<K = any, T = any> extends HTMLTableElement {
    private _source: CollectionView<K, T>;
    private _columns: IColumnTemplate<K, T>[];
    private _rowClickHandler: (this: HTMLTableRowElement) => void;
    private _rowClickObservable: Observable<rowClickEventArgs<T>>;

    private _headers: HTMLTableRowElement;
    private _body: HTMLTableSectionElement;

    private _keySelector: (item: T) => K;

    private _rowMap: Map<K, TableRow<T>>;
    private _sortIdMap: Map<any, HTMLTableHeaderCellElement>;

    get source(): CollectionView<K, T> {
        return this._source;
    }

    constructor(source?: ObservableCollection<T> | CollectionView<K, T>, columns?: IColumnTemplate<K, T>[], rowClick?: (event: rowClickEventArgs<T>) => void) {
        super();

        if (source instanceof CollectionView) {
            this._source = source;
        } else {
            this._source = new CollectionView(source);
        }
        this._source.sortChanged.subscribe((event) => this.updateHeaderSortDisplay(event));

        this._keySelector = this._source.keySelector;

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

    private buildCell(row: HTMLTableRowElement, entry: T, index: number) {
        let template = this._columns[index];

        let property = template.property;
        let propertyData = property == null ? entry : entry[property];

        let cell = row.cells[index];
        if (cell == null) {
            cell = document.createElement('td');
            row.appendChild(cell);
        }

        let cellBuilder = template.cell || this.textCellBuilder;
        cell.append(cellBuilder(propertyData, entry, this));
    }

    private buildRow(item: T): TableRow {
        let row = new TableRow(item);
        let key = this._keySelector(item);

        this._rowMap.set(key, row);

        for (let index = 0; index < this._columns.length; index++) {
            this.buildCell(row, item, index);
        }

        if (this._rowClickObservable.subscriberCount > 0) {
            this.addRowClickHandler(row);
        }

        return row;
    }

    private addRowClickHandler(row: HTMLTableRowElement) {
        row.addEventListener('click', this._rowClickHandler);
    }

    private buildRows() {
        this._rowMap = new Map();

        for (let data of this._source) {
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

    private onHeaderClick(column: IColumnTemplate<K, T>) {
        let sortId = this.getSortId(column);

        let cell = this._sortIdMap.get(sortId);
        let sortDirection = cell.getAttribute('sort');
        let ascending = sortDirection !== 'ascending';

        this.sortBy(column, ascending);
    }

    private getSortId(column: IColumnTemplate<K, T>) {
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
        for (let row of this._source) {
            this.buildRow(row);
        }
    }

    private doReset(rowEntries: T[]) {
        this._rowMap?.clear();

        if (rowEntries == null) {
            this.doAdd();
        } else {
            this.doUpdate(rowEntries);
        }

        this.doReorder();
    }

    private doRemove(rowEntries: T[]) {
        let rowMap = this._rowMap;
        let keySelector = this._keySelector;

        for (let entry of rowEntries) {
            let key = keySelector(entry);
            let oldRow = rowMap.get(key);
            if (oldRow !== undefined) {
                rowMap.delete(key);
                oldRow.remove();
            }
        }
    }

    private doUpdate(rowEntries: T[]) {
        let rowMap = this._rowMap;
        let isSorted = this._source.isSorted;
        let keySelector = this._keySelector;

        for (let entry of rowEntries) {
            let key = keySelector(entry);
            let row = rowMap.get(key);
            if (row === undefined) {
                let row = this.buildRow(entry);
                if (!isSorted) {
                    // We only need to add rows when not sorted.
                    // In the sorted cases the CollectionView will raise a reorder event.
                    this._body.appendChild(row);
                }
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
        let keySelector = this._keySelector;

        for (let entry of this._source) {
            let key = keySelector(entry);
            let row = rowMap.get(key);
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
            for (let row of this._rowMap.values()) {
                this.addRowClickHandler(row);
            }
        }

        let unsub = this._rowClickObservable.subscribe(callback);
        return (() => {
            unsub();

            if (this._rowClickObservable.subscriberCount !== 0) {
                return;
            }

            for (let row of this._rowMap.values()) {
                row.removeEventListener('click', this._rowClickHandler);
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

export interface IColumnTemplate<K = any, T = any> {
    property?: string;
    header?: (headerCell?: HTMLTableHeaderCellElement, table?: Table<K, T>) => Node | string;
    cell?: (value: any, item?: T, table?: Table<K, T>) => Node | string;
    comparator?: (a: any, b: any) => number;
    sortId?: any;
    sortingDisabled?: boolean;
    getSortSpecification?(table?: Table<K, T>): SortSpecification<T>;
    connectedCallback?(table?: Table<K, T>): void;
    disconnectedCallback?(table?: Table<K, T>): void;
}

export class ColumnTemplate<K = any, T = any> implements IColumnTemplate<K, T>{
    property: string;
    header: (headerCell?: HTMLTableHeaderCellElement, table?: Table<K, T>) => Node | string;
    cell: (value: any, item: T, table?: Table<K, T>) => Node | string;
    comparator: (a: any, b: any) => number;
    sortId: any;
    sortingDisabled: boolean;

    setProperty(property: string): this {
        this.property = property;
        return this;
    }

    setHeader(header: (headerCell?: HTMLTableHeaderCellElement, table?: Table<K, T>) => Node | string): this {
        this.header = header;
        return this;
    }

    setCell(cell: (value: any, item: T, table?: Table<K, T>) => Node | string): this {
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

export class TextColumn<K = any, T = any> extends ColumnTemplate<K, T> {
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

export class DateTimeColumn<K = any, T = any> extends ColumnTemplate<K, T>{
    static cell(item: Date): string {
        return Utils.formatDate(item);
    }

    constructor(property?: string) {
        super();
        this.property = property;
        this.cell = DateTimeColumn.cell;
    }
}

export class MultiSelectColumn<K = any, T = any> extends ColumnTemplate<K, T>{
    static cell<K, T>(value: any, item: T, table: Table<K, T>): Node {
        let source = table.source;

        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = source.isSelectedItem(value);
        EventListener.onClick(checkbox, (event) => {
            event.stopPropagation();
            source.setSelectedItem(value, checkbox.checked);
        });

        return checkbox;
    }

    static header<K, T>(headerCell?: HTMLTableHeaderCellElement, table?: Table<K, T>): Node {
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

        headerCell.style.width = '4rem'
        headerCell.style.minWidth = '0px';

        return container;
    }

    private _rowClickSubscription: () => void;

    constructor(private disableRowClick?: boolean) {
        super();

        this.cell = MultiSelectColumn.cell;
        this.header = MultiSelectColumn.header;
    }

    connectedCallback(table: Table<K, T>) {
        if (this.disableRowClick) {
            return;
        }

        this._rowClickSubscription = table.onRowClick(event => {
            let source = table.source;
            let item = event.item;
            let key = source.keySelector(item);

            source.setSelected(key, !source.isSelected(key));
        });
    }

    disconnectedCallback(table: Table<K, T>) {
        Observable.unSubscribe(this._rowClickSubscription);
    }

    getSortSpecification(table: Table<K, T>): SortSpecification<T> {
        return { ascendingComparator: table.source.selectedComparatorBuilder(), sortId: table.source.selectedSortId };
    }
}

export class SingleSelectColumn<K = any, T = any> extends ColumnTemplate<K, T>{
    static cell<K, T>(value: any, item: T, table: Table<K, T>): Node {
        let source = table.source;

        let radio = document.createElement('input');
        radio.type = 'radio';
        radio.checked = source.isSelectedItem(value);
        EventListener.onClick(radio, (event) => {
            event.stopPropagation();

            if (source.isSelectedItem(value)) {
                source.unSelectAll();
            } else {
                source.setSingleSelectedItem(value);
            }
        });

        return radio;
    }

    static header<K, T>(headerCell?: HTMLTableHeaderCellElement, table?: Table<K, T>): Node {
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

        headerCell.style.width = '4rem'
        headerCell.style.minWidth = '0px';

        return container;
    }

    private _rowClickSubscription: () => void;

    constructor(private disableRowClick?: boolean) {
        super();

        this.cell = SingleSelectColumn.cell;
        this.header = SingleSelectColumn.header;
    }

    connectedCallback(table: Table<K, T>) {
        if (this.disableRowClick) {
            return;
        }

        this._rowClickSubscription = table.onRowClick(event => {
            let source = table.source;
            let item = event.item;

            if (source.isSelectedItem(item)) {
                source.unSelectAll();
            } else {
                source.setSingleSelectedItem(item);
            }
        });
    }

    disconnectedCallback(table: Table<K, T>) {
        Observable.unSubscribe(this._rowClickSubscription);
    }

    getSortSpecification(table: Table<K, T>): SortSpecification<T> {
        return { ascendingComparator: table.source.selectedComparatorBuilder(), sortId: table.source.selectedSortId };
    }
}