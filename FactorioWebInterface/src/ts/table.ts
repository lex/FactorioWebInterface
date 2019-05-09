export interface CellBuilder {
    Property: string;
    CellBuilder: (cell: HTMLTableCellElement, data: any) => void;
    SortKeySelector?: (r: HTMLTableCellElement) => any;
}

export enum TableDataType {
    Reset = "Reset",
    Remove = "Remove",
    Add = "Add",
    Update = "Update"
}

export interface TableData {
    Type: TableDataType;
    Rows: any[];
}

export class Table {
    private cellBuilders: CellBuilder[];
    private equal: (rowElement: HTMLTableRowElement, data: any) => boolean;
    private onRowClick: (this: HTMLTableRowElement, ev: MouseEvent) => void;
    private tableHeaders: HTMLCollectionOf<HTMLTableHeaderCellElement>;
    private tableBody: HTMLTableSectionElement;
    private tableRows: HTMLTableRowElement[];
    private ascending: boolean = true;
    private sortIndex: number;

    constructor(table: HTMLTableElement, cellBuilders: CellBuilder[],
        equal: (rowElement: HTMLTableRowElement, data: any) => boolean,
        onRowClick?: (this: HTMLTableRowElement, ev: MouseEvent) => void) {

        this.cellBuilders = cellBuilders;
        this.equal = equal;
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

        for (let i = 0; i < cellBuilders.length; i++) {
            let cb = cellBuilders[i];

            if (cb.SortKeySelector !== undefined) {
                let cell = this.tableHeaders[i];
                cell.onclick = () => this.onHeaderClick(i);
            }
        }
    }

    update(tableUpdate: TableData): void {
        let type = tableUpdate.Type;
        let rows = tableUpdate.Rows;
        let tableRows = this.tableRows;

        switch (type) {
            case TableDataType.Reset: {
                tableRows = [];
                this.tableRows = tableRows;
                // Fall through to add case.
            }
            case TableDataType.Add: {
                for (let row of rows) {
                    let rowElement = document.createElement('tr');
                    if (this.onRowClick !== undefined) {
                        rowElement.onclick = this.onRowClick;
                    }

                    for (let builder of this.cellBuilders) {
                        let cell = document.createElement('td');
                        let data = row[builder.Property];

                        rowElement.appendChild(cell);
                        builder.CellBuilder(cell, data);
                    }

                    tableRows.push(rowElement);
                }

                this.sort();
                this.reBuild();

                break;
            }
            case TableDataType.Remove: {
                let equal = this.equal;

                for (let row of rows) {

                    let i = this.tableRows.findIndex(function (e) {
                        return equal(e, row);
                    });

                    if (i !== -1) {
                        let rowElement = tableRows[i];
                        rowElement.remove();
                        tableRows.splice(i, 1);
                    }
                }

                break;
            }
            case TableDataType.Update: {
                let equal = this.equal;

                for (let row of rows) {

                    let rowElement = this.tableRows.find(function (e) {
                        return equal(e, row);
                    });

                    if (rowElement === undefined) {
                        rowElement = document.createElement('tr');
                        if (this.onRowClick !== undefined) {
                            rowElement.onclick = this.onRowClick;
                        }

                        for (let builder of this.cellBuilders) {
                            let cell = document.createElement('td');
                            let data = row[builder.Property];

                            rowElement.appendChild(cell);
                            builder.CellBuilder(cell, data);
                        }

                        tableRows.push(rowElement);
                    } else {

                        rowElement.innerHTML = "";
                        for (let builder of this.cellBuilders) {
                            let cell = document.createElement('td');
                            let data = row[builder.Property];

                            rowElement.appendChild(cell);
                            builder.CellBuilder(cell, data);
                        }
                    }
                }

                this.sort();
                this.reBuild();
                break;
            }
            default:
                break;
        }
    }

    sortBy(column: number, ascending: boolean = true): void {
        if (this.sortIndex === column && this.ascending === ascending) {
            return;
        }

        let oldColumn = this.sortIndex;
        if (oldColumn !== undefined) {
            let oldHeader = this.tableHeaders[oldColumn];
            let text = oldHeader.innerText;
            if (text.endsWith(' ▼') || text.endsWith(' ▲')) {
                oldHeader.innerText = text.substr(0, text.length - 1);
            }
        }

        let newHeader = this.tableHeaders[column];
        let symbol = ascending ? ' ▲' : ' ▼';
        newHeader.innerText += symbol;

        this.sortIndex = column;
        this.ascending = ascending;

        this.sort();
        this.reBuild();
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
        this.tableBody.innerHTML = "";

        for (let row of this.tableRows) {
            this.tableBody.appendChild(row);
        }
    }
}
