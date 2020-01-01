import * as signalR from "@microsoft/signalr";
import { MessagePackHubProtocol } from "@microsoft/signalr-protocol-msgpack"
import { CollectionChangedData } from "./utils";
import * as Table from "./table";

(function () {

    interface ScenarioData {
        DataSet: string;
        Key: string;
        Value: string;
    }

    const dataTableElement = document.getElementById('dataTable') as HTMLTableElement;
    const dataSetInput = document.getElementById('dataSetInput') as HTMLInputElement;
    const keyInput = document.getElementById('keyInput') as HTMLInputElement;
    const valueInput = document.getElementById('valueInput') as HTMLTextAreaElement;
    const updateButton = document.getElementById('updateButton') as HTMLButtonElement;
    const refreshDataSets = document.getElementById('refreshDataSets') as HTMLButtonElement;
    const datasetsSelect = document.getElementById('datasetsSelect') as HTMLDivElement;
    const dataSetHeading = document.getElementById('dataSetHeading') as HTMLHeadingElement;

    let dataTable: Table.Table;
    let placeholderOption: HTMLOptionElement = null;
    let currentDataSet = "";

    const connection = new signalR.HubConnectionBuilder()
        .withUrl("/scenarioDataHub")
        .withHubProtocol(new MessagePackHubProtocol())
        .build();

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

        dataSetHeading.textContent = currentDataSet;
        dataTable.clear();
    };

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

    function reBuildDataSetsSelect() {
        datasetsSelect.classList.add('is-loading');
        datasetsSelect.innerHTML = "";

        placeholderOption = document.createElement('option');
        placeholderOption.textContent = 'Fetching Data sets'
        datasetsSelect.appendChild(placeholderOption);

        connection.send('RequestAllDataSets');
    }

    refreshDataSets.onclick = reBuildDataSetsSelect;

    function buildTable() {
        function buildCell(cell: HTMLTableCellElement, data: any) {
            cell.innerText = data;
        }

        function sortCell(cell: HTMLTableCellElement) {
            return cell.textContent.toLowerCase();
        }

        function onRowClicked(this: HTMLTableRowElement) {
            let cells = this.children;

            dataSetInput.value = currentDataSet;
            keyInput.value = cells[0].textContent;
            valueInput.value = cells[1].textContent;
        }

        let cellBuilders: Table.CellBuilder[] = [
            {
                Property: 'Key',
                CellBuilder: buildCell,
                SortKeySelector: sortCell,
                IsKey: true
            },
            {
                Property: 'Value',
                CellBuilder: buildCell,
                SortKeySelector: sortCell
            },
        ];

        dataTable = new Table.Table(dataTableElement, cellBuilders, onRowClicked)
        dataTable.sortBy(0, true);
    }

    async function startConnection() {
        try {
            await connection.start();

            await reBuildDataSetsSelect();
        } catch (ex) {
            console.log(ex.message);
            setTimeout(() => startConnection(), 2000);
        }
    }

    connection.onclose(async () => {
        await startConnection();
    });

    connection.on('SendDataSets', (dataSets: string[]) => {
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
    });

    connection.on('SendEntries', (dataSet: string, data: CollectionChangedData) => {
        if (currentDataSet !== dataSet) {
            return;
        }

        dataTable.update(data);
        dataSetHeading.textContent = currentDataSet + ` (${dataTable.rowsCount()})`;
    });

    function onPageLoad() {
        buildTable();
        startConnection();
    }

    onPageLoad();
})();
