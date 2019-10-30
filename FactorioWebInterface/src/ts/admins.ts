import * as signalR from "@microsoft/signalr";
import { MessagePackHubProtocol } from "@microsoft/signalr-protocol-msgpack"
import * as Table from "./table";
import { Result, CollectionChangedData } from "./utils";

!function () {

    const textArea = document.getElementById('textArea') as HTMLTextAreaElement;
    const addButton = document.getElementById('addButton') as HTMLButtonElement;

    const tableElement = document.getElementById('adminsTable') as HTMLTableElement;

    let table: Table.Table;

    const connection = new signalR.HubConnectionBuilder()
        .withUrl("/factorioAdminHub")
        .withHubProtocol(new MessagePackHubProtocol())
        .build();

    function buildTable() {
        function buildTextCell(cell: HTMLTableCellElement, data: any) {
            cell.innerText = data;
        }

        function buildRemoveCell(cell: HTMLTableCellElement, data: any) {
            let button = document.createElement('button');
            button.innerText = 'Remove';
            button.onclick = onRemoveClick;
            button.classList.add('button', 'is-danger');

            cell.appendChild(button);
        }

        function sortTextCell(cell: HTMLTableCellElement) {
            return cell.textContent.toLowerCase();
        }

        let cellBuilders: Table.CellBuilder[] = [
            {
                Property: "Name",
                CellBuilder: buildTextCell,
                SortKeySelector: sortTextCell,
                IsKey: true
            },
            {
                Property: "Name",
                CellBuilder: buildRemoveCell
            }
        ];

        table = new Table.Table(tableElement, cellBuilders);
        table.sortBy(0, true);
    }

    async function onRemoveClick(this: HTMLButtonElement, ev: MouseEvent) {
        ev.stopPropagation();

        let row = this.parentElement.parentElement;
        let child = row.firstElementChild as HTMLElement;
        let name = child.textContent;

        let result = await connection.invoke('RemoveAdmin', name) as Result;

        if (!result.Success) {
            alert(JSON.stringify(result.Errors));
        }
    }

    addButton.onclick = async () => {
        let data = textArea.value.trim();
        if (data === "") {
            alert('Enter names for admins');
            return;
        }

        let result = await connection.invoke('AddAdmins', data) as Result;

        if (!result.Success) {
            alert(JSON.stringify(result.Errors));
        }
    };

    function updatePage() {
        connection.send('RequestAdmins');
    }

    async function startConnection() {
        try {
            await connection.start();
            updatePage();
        } catch (ex) {
            console.log(ex.message);
            setTimeout(() => startConnection(), 2000);
        }
    }

    connection.on('SendAdmins', (data: CollectionChangedData) => {
        table.update(data);
    });

    function onPageLoad() {
        buildTable();
        startConnection();
    }

    onPageLoad();
}();