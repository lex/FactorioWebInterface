import * as signalR from "@aspnet/signalr";
import { MessagePackHubProtocol } from "@aspnet/signalr-protocol-msgpack"
import * as $ from "jquery";

!function () {

    interface ScenarioData {
        DataSet: string;
        Key: string;
        Value: string;
    }

    const dataTable = document.getElementById('dataTable') as HTMLTableElement;
    const dataSetInput = document.getElementById('dataSetInput') as HTMLInputElement;
    const keyInput = document.getElementById('keyInput') as HTMLInputElement;
    const valueInput = document.getElementById('valueInput') as HTMLTextAreaElement;
    const updateButton = document.getElementById('updateButton') as HTMLButtonElement;
    const refreshDataSets = document.getElementById('refreshDataSets') as HTMLButtonElement;
    const datasetsSelect = document.getElementById('datasetsSelect') as HTMLDivElement;

    let placeholderOption: HTMLOptionElement = null;

    let currentDataSet = "";
    let dataMap = new Map<string, HTMLTableRowElement>();

    datasetsSelect.onchange = function (this: HTMLSelectElement) {
        let selected = this.selectedOptions[0];

        if (selected === placeholderOption) {
            return;
        }

        let set = this.value;

        let child = this.children[0] as HTMLOptionElement;
        if (child === placeholderOption) {
            this.removeChild(child);
        }

        currentDataSet = set;
        connection.send('TrackDataSet', set);
        connection.send('RequestAllDataForDataSet', set);
    };

    function createCell(row: HTMLTableRowElement, value: string) {
        let cell = document.createElement('td');
        cell.innerText = value;
        row.appendChild(cell);
    }

    async function reBuildDataSetsSelect() {
        datasetsSelect.classList.add('is-loading');
        datasetsSelect.innerHTML = "";

        placeholderOption = document.createElement('option');
        placeholderOption.textContent = 'Fetching Data sets'
        datasetsSelect.appendChild(placeholderOption);

        let dataSets: string[] = await connection.invoke('GetAllDataSets');

        datasetsSelect.classList.remove('is-loading');
        datasetsSelect.innerHTML = "";

        placeholderOption = document.createElement('option');
        placeholderOption.textContent = 'Select a Data set'
        datasetsSelect.appendChild(placeholderOption);

        for (let set of dataSets) {
            let option = document.createElement('option');
            option.textContent = set;
            datasetsSelect.appendChild(option);
        }
    }

    function buildDataTable() {
        let cells = dataTable.tHead.rows[0].cells;
        cells[0].onclick = () => sortTable(dataTable, 'key');
        cells[1].onclick = () => sortTable(dataTable, 'value');

        let jTable = $(dataTable);
        jTable.data('key', r => r.children[0].textContent.toLowerCase());
        jTable.data('value', r => r.children[1].textContent.toLowerCase());
    }

    buildDataTable();

    const connection = new signalR.HubConnectionBuilder()
        .withUrl("/scenarioDataHub")
        .withHubProtocol(new MessagePackHubProtocol())
        .build();

    async function start() {
        try {
            await connection.start();

            await reBuildDataSetsSelect();
        } catch (ex) {
            console.log(ex.message);
            setTimeout(() => start(), 2000);
        }
    }

    connection.onclose(async () => {
        await start();
    });

    function onRowClicked(this: HTMLTableRowElement) {
        let cells = this.children;

        dataSetInput.value = currentDataSet;
        keyInput.value = cells[0].textContent;
        valueInput.value = cells[1].textContent;
    }

    connection.on('SendAllEntriesForDataSet', (dataSet: string, datas: ScenarioData[]) => {
        if (currentDataSet !== dataSet)
            return;

        let body = dataTable.tBodies[0];

        body.innerHTML = "";
        dataMap = new Map();

        for (let data of datas) {
            let row = document.createElement('tr');
            createCell(row, data.Key);
            createCell(row, data.Value);
            body.appendChild(row);

            dataMap.set(data.Key, row)

            row.onclick = onRowClicked;
        }

        let jTable = $(dataTable);

        let rows: HTMLTableRowElement[] = []
        let rc = body.rows;
        for (let i = 0; i < rc.length; i++) {
            let r = rc[i];
            rows.push(r);
        }
        jTable.data('rows', rows);

        jTable.data('sortProperty', 'key');
        jTable.data('ascending', false);
        sortTable(dataTable, 'key');
    });

    connection.on('SendEntry', (data: ScenarioData) => {
        if (data.DataSet !== currentDataSet) {
            return;
        }

        let jTable = $(dataTable);
        let rows: HTMLTableRowElement[] = jTable.data('rows');

        if (data.Value === null || data.Value === undefined) {
            if (dataMap.has(data.Key)) {
                let row = dataMap.get(data.Key);
                row.remove();
                let index = rows.indexOf(row)
                rows.splice(index, 1);
                dataMap.delete(data.Key);
            }
        }
        else {

            if (dataMap.has(data.Key)) {
                let row = dataMap.get(data.Key);
                row.cells[1].innerText = data.Value
            } else {
                let body = dataTable.tBodies[0];

                let row = document.createElement('tr');
                createCell(row, data.Key);
                createCell(row, data.Value);
                body.appendChild(row);

                dataMap.set(data.Key, row)

                row.onclick = onRowClicked;

                if (rows) {
                    rows.push(row);
                }
            }

            if (rows) {
                let direction = jTable.data('ascending');
                jTable.data('ascending', !direction);
                let property = jTable.data('sortProperty');
                sortTable(dataTable, property);
            }
        }
    });

    updateButton.onclick = () => {
        let data = {} as ScenarioData;
        data.DataSet = dataSetInput.value;
        data.Key = keyInput.value;

        let value = valueInput.value;
        if (value.trim() !== "") {
            data.Value = value;
        }

        connection.invoke('UpdateData', data);
    };

    refreshDataSets.onclick = async () => {
        await reBuildDataSetsSelect();
    }

    function sortTable(table: HTMLTableElement, property: string) {
        let jTable = $(table);

        let rows: HTMLTableRowElement[] = jTable.data('rows');
        let keySelector: (r: HTMLTableRowElement) => any = jTable.data(property);

        let sortProperty = jTable.data('sortProperty');

        let ascending: boolean;
        if (sortProperty === property) {
            ascending = !jTable.data('ascending');
            jTable.data('ascending', ascending);
        } else {
            jTable.data('sortProperty', property);
            ascending = true;
            jTable.data('ascending', ascending);
        }

        if (ascending) {
            rows.sort((a, b) => {
                let left = keySelector(a);
                let right = keySelector(b);
                if (left === right) {
                    return 0;
                } else if (left > right) {
                    return 1;
                } else {
                    return -1;
                }
            });
        } else {
            rows.sort((a, b) => {
                let left = keySelector(a);
                let right = keySelector(b);
                if (left === right) {
                    return 0;
                } else if (left > right) {
                    return -1;
                } else {
                    return 1;
                }
            });
        }

        let body = table.tBodies[0];
        body.innerHTML = "";

        for (let i = 0; i < rows.length; i++) {
            let r = rows[i];
            body.appendChild(r);
        }
    }

    start();
}();
