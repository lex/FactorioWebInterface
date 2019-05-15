export interface CellBuilder {
    Property?: string | undefined;
    CellBuilder: (cell: HTMLTableCellElement, data: any, oldCell?: HTMLTableCellElement) => void;
    SortKeySelector?: (r: HTMLTableCellElement) => any;
    HeaderBuilder?: (cell: HTMLTableHeaderCellElement, symbol: string) => void;
    IsKey?: boolean;
}

export enum TableDataType {
    Reset = "Reset",
    Remove = "Remove",
    Add = "Add",
    Update = "Update",
    Compound = "Compound"
}

export interface TableData<T = any> {
    Type: TableDataType;
    Rows: T[];
    TableDatas: TableData<T>[];
}

export class Table<T = any> {
    private cellBuilders: CellBuilder[];
    private keySelector: (data: T) => any;
    private onRowClick: (this: HTMLTableRowElement, ev: MouseEvent) => void;
    private tableHeaders: HTMLCollectionOf<HTMLTableHeaderCellElement>;
    private tableBody: HTMLTableSectionElement;
    private tableRows: HTMLTableRowElement[];
    private tableMap: Map<any, HTMLTableRowElement>;
    private ascending: boolean = true;
    private sortIndex: number;

    constructor(table: HTMLTableElement, cellBuilders: CellBuilder[],
        onRowClick?: (this: HTMLTableRowElement, ev: MouseEvent) => void,
        keySelector?: (data: T) => any) {

        this.cellBuilders = cellBuilders;
        this.keySelector = keySelector
        this.onRowClick = onRowClick;

        this.tableHeaders = table.tHead.rows[0].cells;
        this.tableBody = table.tBodies[0];

        if (this.tableBody === null || this.tableBody === undefined) {
            this.tableBody = document.createElement('tbody');
            table.appendChild(this.tableBody);
        }

        this.tableRows = [];
        let rows = this.tableBody.rows;
        for (let i = 0; i < rows.length; i++) {
            let row = rows[i];
            this.tableRows.push(row);
            if (onRowClick !== undefined) {
                row.onclick = onRowClick;
            }
        }

        if (this.keySelector === undefined) {
            for (let cb of cellBuilders) {
                if (cb.IsKey) {
                    let prop = cb.Property
                    this.keySelector = (data: T) => data[prop];
                    break;
                }
            }
        }

        if (this.keySelector !== undefined) {
            this.tableMap = new Map<any, HTMLTableRowElement>();
        }

        for (let i = 0; i < cellBuilders.length; i++) {
            let cb = cellBuilders[i];

            if (cb.SortKeySelector !== undefined) {
                let cell = this.tableHeaders[i];
                cell.onclick = () => this.onHeaderClick(i);
            }
        }
    }

    private buildCell(builder: CellBuilder, rowElement: HTMLTableRowElement, row: T, oldCell?: HTMLTableCellElement) {
        let data;
        let prop = builder.Property;
        if (prop === undefined) {
            data = row;
        } else {
            data = row[prop];
        }

        let cell = document.createElement('td');

        if (oldCell === undefined) {
            rowElement.appendChild(cell);
        } else {
            rowElement.insertBefore(cell, oldCell);
            oldCell.remove();
        }

        builder.CellBuilder(cell, data, oldCell);
    }

    private doAdd(rows: T[]) {
        let keySelector = this.keySelector;
        let tableRows = this.tableRows;

        for (let row of rows) {
            let rowElement = document.createElement('tr');
            if (this.onRowClick !== undefined) {
                rowElement.onclick = this.onRowClick;
            }

            for (let builder of this.cellBuilders) {
                this.buildCell(builder, rowElement, row);
            }

            tableRows.push(rowElement);

            if (keySelector !== undefined) {
                let key = keySelector(row);
                this.tableMap.set(key, rowElement);
            }
        }

        return true;
    }

    private doReset(rows: T[]) {
        this.tableRows = [];
        this.doAdd(rows);
        return true;
    }

    private doRemove(rows: T[]) {
        let keySelector = this.keySelector;

        if (keySelector === undefined) {
            console.error('Table keySelector must be set to support removal.');
            return false;
        }

        let tableMap = this.tableMap;
        let tableRows = this.tableRows;

        for (let row of rows) {

            let key = keySelector(row);
            let oldRow = tableMap.get(key);
            if (oldRow !== undefined) {
                tableMap.delete(key);

                let index = tableRows.indexOf(oldRow);
                if (index !== -1) {
                    tableRows.splice(index, 1);
                }

                oldRow.remove();
            }
        }

        return false;
    }

    private doUpdate(rows: T[]) {
        let keySelector = this.keySelector;

        if (keySelector === undefined) {
            console.error('Table keySelector must be set to support update.');
            return false;
        }

        let tableMap = this.tableMap;
        let tableRows = this.tableRows;

        for (let row of rows) {

            let key = keySelector(row);
            let rowElement = tableMap.get(key);

            if (rowElement === undefined) {
                rowElement = document.createElement('tr');
                if (this.onRowClick !== undefined) {
                    rowElement.onclick = this.onRowClick;
                }

                for (let builder of this.cellBuilders) {
                    this.buildCell(builder, rowElement, row);
                }

                tableRows.push(rowElement);
                tableMap.set(key, rowElement);
            } else {
                for (let i = 0; i < this.cellBuilders.length; i++) {
                    let builder = this.cellBuilders[i];
                    let oldCell = rowElement.cells[i];

                    this.buildCell(builder, rowElement, row, oldCell);
                }
            }
        }

        return true;
    }

    private innerUpdate(tableUpdate: TableData): boolean {
        let type = tableUpdate.Type;
        let rows = tableUpdate.Rows;

        switch (type) {
            case TableDataType.Reset:
                return this.doReset(rows)
            case TableDataType.Add:
                return this.doAdd(rows);
            case TableDataType.Remove:
                return this.doRemove(rows);
            case TableDataType.Update:
                return this.doUpdate(rows);
            case TableDataType.Compound:
                let dirty = false;
                for (let td of tableUpdate.TableDatas) {
                    dirty = dirty || this.innerUpdate(td);
                }
                return dirty;
            default:
                return false;
        }
    }

    update(tableUpdate: TableData): void {
        if (this.innerUpdate(tableUpdate)) {
            this.reBuild();
        }
    }

    clear(): void {
        this.tableRows = [];
        this.tableBody.innerHTML = "";
    }

    sortBy(column: number, ascending: boolean = true): void {
        if (this.sortIndex === column && this.ascending === ascending) {
            return;
        }

        let oldColumn = this.sortIndex;
        if (oldColumn !== undefined) {
            let oldHeader = this.tableHeaders[oldColumn];
            let headerBuilder = this.cellBuilders[oldColumn].HeaderBuilder;
            if (headerBuilder === undefined) {
                let text = oldHeader.textContent;
                if (text.endsWith(' ▼') || text.endsWith(' ▲')) {
                    oldHeader.textContent = text.substr(0, text.length - 2);
                }
            }
            else {
                headerBuilder(oldHeader, '');
            }
        }

        let newHeader = this.tableHeaders[column];
        let newHeaderBuilder = this.cellBuilders[column].HeaderBuilder;
        let symbol = ascending ? ' ▲' : ' ▼';
        if (newHeaderBuilder === undefined) {
            newHeader.textContent += symbol;
        } else {
            newHeaderBuilder(newHeader, symbol);
        }

        this.sortIndex = column;
        this.ascending = ascending;

        this.reBuild();
    }

    rowsCount() {
        return this.tableRows.length;
    }

    rows() {
        return this.tableRows;
    }

    private onHeaderClick(index: number) {
        let ascending: boolean;
        if (this.sortIndex === index) {
            ascending = !this.ascending;
        } else {
            ascending = true;
        }

        this.sortBy(index, ascending);
    }

    private sort() {
        let index = this.sortIndex;
        if (index === undefined) {
            return;
        }

        let keySelector = this.cellBuilders[index].SortKeySelector;

        if (this.ascending) {
            this.tableRows.sort((a, b) => {
                let left = keySelector(a.cells[index]);
                let right = keySelector(b.cells[index]);
                if (left === right) {
                    return 0;
                } else if (left > right) {
                    return 1;
                } else {
                    return -1;
                }
            });
        } else {
            this.tableRows.sort((a, b) => {
                let left = keySelector(a.cells[index]);
                let right = keySelector(b.cells[index]);
                if (left === right) {
                    return 0;
                } else if (left > right) {
                    return -1;
                } else {
                    return 1;
                }
            });
        }
    }

    private reBuild() {
        this.sort();

        this.tableBody.innerHTML = "";

        for (let row of this.tableRows) {
            this.tableBody.appendChild(row);
        }
    }
}
