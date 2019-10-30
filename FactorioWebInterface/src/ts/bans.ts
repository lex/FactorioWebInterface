import * as signalR from "@microsoft/signalr";
import { MessagePackHubProtocol } from "@microsoft/signalr-protocol-msgpack"
import * as Table from "./table";
import { Result, Utils, CollectionChangedData } from "./utils";

!function () {
    interface Ban {
        Username: string;
        Reason: string;
        Admin: string;
        DateTime: Date;
    }

    const tableElement = document.getElementById('bansTable') as HTMLTableElement;

    const addBanForm = document.getElementById('addBanForm') as HTMLFormElement;
    const usernameInput = document.getElementById('usernameInput') as HTMLInputElement;
    const reasonInput = document.getElementById('reasonInput') as HTMLTextAreaElement;
    const adminInput = document.getElementById('adminInput') as HTMLInputElement;
    const dateInput = document.getElementById('dateInput') as HTMLInputElement;
    const timeInput = document.getElementById('timeInput') as HTMLInputElement;
    const synchronizeWithServersCheckbox = document.getElementById('synchronizeWithServersCheckbox') as HTMLInputElement;
    const banCount = document.getElementById('banCount') as HTMLSpanElement;

    let table: Table.Table;

    const connection = new signalR.HubConnectionBuilder()
        .withUrl("/factorioBanHub")
        .withHubProtocol(new MessagePackHubProtocol())
        .build();

    function buildTable() {
        function buildCell(cell: HTMLTableCellElement, data: any) {
            cell.innerText = data;
        }
        function buildDateCell(cell: HTMLTableCellElement, data: any) {
            cell.innerText = Utils.formatDate(data);
        }

        function buildRemoveCell(cell: HTMLTableCellElement, data: any) {
            let button = document.createElement('button') as HTMLButtonElement
            button.innerText = 'Remove';
            button.classList.add('button', 'is-danger');
            button.onclick = removeBanClick;
            cell.appendChild(button);
        }

        function sortTextCell(cell: HTMLTableCellElement) {
            return cell.textContent.toLowerCase();
        }

        function sortDateCell(cell: HTMLTableCellElement) {
            return cell.textContent;
        }

        function onRowClicked(this: HTMLTableRowElement) {
            setform(this);
        }

        async function removeBanClick(this: HTMLElement, event: MouseEvent) {
            event.stopPropagation();

            let parent = this.parentElement.parentElement as HTMLTableRowElement;
            setform(parent);

            let cells = parent.cells

            let username = cells[0].textContent;

            let result = await connection.invoke('RemoveBan', username, synchronizeWithServersCheckbox.checked) as Result;

            if (!result.Success) {
                alert(JSON.stringify(result.Errors));
            }
        }

        let cellBuilders: Table.CellBuilder[] = [
            {
                Property: 'Username',
                CellBuilder: buildCell,
                SortKeySelector: sortTextCell,
                IsKey: true
            },
            {
                Property: 'Reason',
                CellBuilder: buildCell,
                SortKeySelector: sortTextCell
            },
            {
                Property: 'Admin',
                CellBuilder: buildCell,
                SortKeySelector: sortTextCell
            },
            {
                Property: 'DateTime',
                CellBuilder: buildDateCell,
                SortKeySelector: sortDateCell
            },
            {
                Property: 'Remove',
                CellBuilder: buildRemoveCell,
            }
        ];

        table = new Table.Table(tableElement, cellBuilders, onRowClicked);
        table.sortBy(3, false);
    }

    async function addBanClick(this: HTMLElement, event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();

        let date = new Date(dateInput.value + 'T' + timeInput.value + '+00:00');

        let ban: Ban = {
            Username: usernameInput.value,
            Reason: reasonInput.value,
            Admin: adminInput.value,
            DateTime: date
        };

        let result = await connection.invoke('AddBan', ban, synchronizeWithServersCheckbox.checked) as Result;
        if (!result.Success) {
            alert(JSON.stringify(result.Errors));
        }
    }

    function setform(row: HTMLTableRowElement) {
        let cells = row.cells;

        let dateTime = cells[3].textContent.split(' ');

        usernameInput.value = cells[0].textContent;
        reasonInput.value = cells[1].textContent;
        adminInput.value = cells[2].textContent;
        dateInput.value = dateTime[0];
        timeInput.value = dateTime[1];
    }

    function updateBanCount() {
        let length = table.rowsCount();
        banCount.textContent = '(' + length + ')';
    }

    async function startConnection() {
        try {
            await connection.start();
            connection.send('RequestAllBans');
        } catch (ex) {
            console.log(ex.message);
            setTimeout(() => startConnection(), 2000);
        }
    }

    connection.onclose(async () => {
        await startConnection();
    });

    connection.on('SendBans', (data: CollectionChangedData) => {
        table.update(data);
        updateBanCount();
    });

    function onPageLoad() {
        addBanForm.onsubmit = addBanClick;
        buildTable();
        updateBanCount();
        startConnection();
    }

    onPageLoad();
}();