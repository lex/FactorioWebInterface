import * as signalR from "@aspnet/signalr";
import { MessagePackHubProtocol } from "@aspnet/signalr-protocol-msgpack"
import * as $ from "jquery";

!function () {
    interface ModPackMetaData {
        Name: string;
        CreatedTime: string;
        LastModifiedTime: string;
    }

    interface ModPackFileMetaData {
        Name: string;
        CreatedTime: string;
        LastModifiedTime: string;
        Size: number;
    }

    interface Result {
        Success: boolean;
        Errors: Error[];
    }

    const modPacksTable = document.getElementById('modPacksTable') as HTMLTableElement;

    const newModPackButton = document.getElementById('newModPackButton') as HTMLButtonElement;


    const newModPackModal = document.getElementById('newModPackModal') as HTMLDivElement;
    const newModPackModalBackground = document.getElementById('newModPackModalBackground') as HTMLDivElement;
    const newModPackModalCloseButton = document.getElementById('newModPackModalCloseButton') as HTMLDivElement;
    const newModPackModalNameInput = document.getElementById('newModPackModalNameInput') as HTMLInputElement;
    const newModPackModalCreateButton = document.getElementById('newModPackModalCreateButton') as HTMLButtonElement;

    const renameModPackModal = document.getElementById('renameModPackModal') as HTMLDivElement;
    const renameModPackModalBackground = document.getElementById('renameModPackModalBackground') as HTMLDivElement;
    const renameModPackModalCloseButton = document.getElementById('renameModPackModalCloseButton') as HTMLDivElement;
    const renameModPackModalNameInput = document.getElementById('renameModPackModalNameInput') as HTMLInputElement;
    const renameModPackModalConfirmButton = document.getElementById('renameModPackModalConfirmButton') as HTMLButtonElement;

    // XSRF/CSRF token, see https://docs.microsoft.com/en-us/aspnet/core/security/anti-request-forgery?view=aspnetcore-2.1
    let requestVerificationToken = (document.querySelector('input[name="__RequestVerificationToken"][type="hidden"]') as HTMLInputElement).value

    let renameOldName: string = null;
    let currentModPack: string = null;

    const connection = new signalR.HubConnectionBuilder()
        .withUrl("/factorioModHub")
        .withHubProtocol(new MessagePackHubProtocol())
        .build();

    async function start() {
        try {
            await connection.start();
            UpdatePage();

        } catch (ex) {
            console.log(ex.message);
            setTimeout(() => start(), 2000);
        }
    }

    connection.onclose(async () => {
        await start();
    });

    async function UpdatePage() {
        let modPacks = await connection.invoke('GetModPacks') as ModPackMetaData[];
        updateModPacks(modPacks);
    }

    function updateModPacks(modPacks: ModPackMetaData[]) {
        let body = modPacksTable.tBodies[0];

        body.innerHTML = "";

        for (let modPack of modPacks) {
            let row = document.createElement('tr');

            let cell1 = document.createElement('td');
            cell1.innerText = modPack.Name;
            row.appendChild(cell1);

            let cell2 = document.createElement('td');
            cell2.innerText = formatDate(modPack.LastModifiedTime);
            row.appendChild(cell2);

            let cell3 = document.createElement('td');
            let renameButton = document.createElement('button');
            renameButton.innerText = 'Rename';
            renameButton.onclick = renameModPack;
            renameButton.classList.add('button', 'is-link');
            cell3.appendChild(renameButton);
            row.appendChild(cell3);

            let cell4 = document.createElement('td');
            let deleteButton = document.createElement('button');
            deleteButton.innerText = 'Delete';
            deleteButton.onclick = deleteModPack;
            deleteButton.classList.add('button', 'is-danger');
            cell4.appendChild(deleteButton);
            row.appendChild(cell4);

            body.appendChild(row);
        }
    }

    function renameModPack(this: HTMLButtonElement, ev: MouseEvent) {
        let row = this.parentElement.parentElement;
        let child = row.firstElementChild as HTMLElement;
        let name = child.innerText

        renameOldName = name;

        renameModPackModal.classList.add('is-active');
        renameModPackModalNameInput.value = name;
        renameModPackModalNameInput.focus();
    }

    async function deleteModPack(this: HTMLButtonElement, ev: MouseEvent) {
        let row = this.parentElement.parentElement;
        let child = row.firstElementChild as HTMLElement;
        let name = child.innerText

        let result = await connection.invoke('DeleteModPack', name) as Result;

        if (!result.Success) {
            alert(JSON.stringify(result.Errors));
        }
    }

    function updateModPackFiles(modPack: string, files: ModPackFileMetaData[]) {
        if (modPack !== currentModPack) {
            return;
        }
    }

    connection.on("SendModPacks", updateModPacks)

    connection.on("SendModPackFiles", updateModPackFiles)

    newModPackButton.onclick = () => {
        newModPackModal.classList.add('is-active');
        newModPackModalNameInput.focus();
    };

    function closeNewModPackModal() {
        newModPackModal.classList.remove('is-active');
    }

    newModPackModalBackground.onclick = closeNewModPackModal;
    newModPackModalCloseButton.onclick = closeNewModPackModal;

    async function createNewModPack() {
        let name = newModPackModalNameInput.value;

        let result = await connection.invoke('CreateModPack', name) as Result;

        if (result.Success) {
            closeNewModPackModal();
        }
        else {
            alert(JSON.stringify(result.Errors));
        }
    }

    newModPackModalCreateButton.onclick = createNewModPack;
    newModPackModalNameInput.onkeydown = function (this: HTMLInputElement, ev: KeyboardEvent) {
        if (ev.keyCode === 13) {
            createNewModPack();
        }
    };

    function closeRenameModPackModal() {
        renameModPackModal.classList.remove('is-active');
    }

    renameModPackModalBackground.onclick = closeRenameModPackModal;
    renameModPackModalCloseButton.onclick = closeRenameModPackModal;

    async function requestRenameModPack() {
        let name = renameModPackModalNameInput.value;

        let result = await connection.invoke('RenameModPack', renameOldName, name) as Result;

        if (result.Success) {
            closeRenameModPackModal();
        } else {
            alert(JSON.stringify(result.Errors));
        }
    }

    renameModPackModalConfirmButton.onclick = requestRenameModPack;
    renameModPackModalNameInput.onkeydown = function (this: HTMLInputElement, ev: KeyboardEvent) {
        if (ev.keyCode === 13) {
            requestRenameModPack();
        }
    }

    function pad(number) {
        return number < 10 ? '0' + number : number;
    }

    function formatDate(dateString: string): string {
        let date = new Date(dateString);
        let year = pad(date.getUTCFullYear());
        let month = pad(date.getUTCMonth() + 1);
        let day = pad(date.getUTCDate());
        let hour = pad(date.getUTCHours());
        let min = pad(date.getUTCMinutes());
        let sec = pad(date.getUTCSeconds());
        return year + '-' + month + '-' + day + ' ' + hour + ':' + min + ':' + sec;
    }

    start();
}();