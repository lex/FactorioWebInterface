import * as Table from "./table";

(function () {
    function buildTable(id: string) {
        const tableElement: HTMLTableElement = document.getElementById(id) as HTMLTableElement;

        let cellBuilders: Table.CellBuilder[] = [
            {
                Property: 'Name',
                CellBuilder: undefined,
                SortKeySelector: c => c.textContent.toLowerCase(),
                IsKey: true
            },
            {
                Property: 'LastModifiedTime',
                CellBuilder: undefined,
                SortKeySelector: c => c.textContent
            },
            {
                Property: 'Size',
                CellBuilder: undefined,
                SortKeySelector: c => Number.parseInt(c.getAttribute('data-size'))
            }
        ];

        let table = new Table.Table(tableElement, cellBuilders)
        table.sortBy(1, false);
    }

    buildTable('startSavesTable');
    buildTable('finalSavesTable');
    buildTable('oldSavesTable');
})();