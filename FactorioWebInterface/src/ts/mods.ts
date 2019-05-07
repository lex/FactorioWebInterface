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
    const modPackFilesDiv = document.getElementById('modPackFilesDiv') as HTMLDivElement;

    const currentModPackTitle = document.getElementById('currentModPackTitle') as HTMLHeadingElement;
    const fileTable = document.getElementById('fileTable') as HTMLTableElement;
    const uploadfileInput = document.getElementById('uploadfileInput') as HTMLInputElement;
    const uploadFileButton = document.getElementById('uploadFileButton') as HTMLButtonElement;
    const fileProgress = document.getElementById('fileProgress') as HTMLProgressElement;
    const fileProgressContiner = document.getElementById('fileProgressContiner') as HTMLSpanElement;
    const deleteFileButton = document.getElementById('deleteFileButton') as HTMLButtonElement;

    const newModPackModal = document.getElementById('newModPackModal') as HTMLDivElement;
    const newModPackModalBackground = document.getElementById('newModPackModalBackground') as HTMLDivElement;
    const newModPackModalCloseButton = document.getElementById('newModPackModalCloseButton') as HTMLDivElement;
    const newModPackModalNameInput = document.getElementById('newModPackModalNameInput') as HTMLInputElement;
    const newModPackModalCreateButton = document.getElementById('newModPackModalCreateButton') as HTMLButtonElement;

    const renameModPackModal = document.getElementById('renameModPackModal') as HTMLDivElement;
    const renameModPackModalBackground = document.getElementById('renameModPackModalBackground') as HTMLDivElement;
    const renameModPackModalCloseButton = document.getElementById('renameModPackModalCloseButton') as HTMLDivElement;
    const renameModPackModalOldNameLabel = document.getElementById('renameModPackModalOldNameLabel') as HTMLLabelElement;
    const renameModPackModalNameInput = document.getElementById('renameModPackModalNameInput') as HTMLInputElement;
    const renameModPackModalConfirmButton = document.getElementById('renameModPackModalConfirmButton') as HTMLButtonElement;

    const deleteModPackModal = document.getElementById('deleteModPackModal') as HTMLDivElement;
    const deleteModPackModalBackground = document.getElementById('deleteModPackModalBackground') as HTMLDivElement;
    const deleteModPackModalCloseButton = document.getElementById('deleteModPackModalCloseButton') as HTMLDivElement;
    const deleteModPackModalNameLabel = document.getElementById('deleteModPackModalNameLabel') as HTMLLabelElement;
    const deleteModPackModalCancelButton = document.getElementById('deleteModPackModalCancelButton') as HTMLButtonElement;
    const deleteModPackModalConfirmButton = document.getElementById('deleteModPackModalConfirmButton') as HTMLButtonElement;

    // XSRF/CSRF token, see https://docs.microsoft.com/en-us/aspnet/core/security/anti-request-forgery?view=aspnetcore-2.1
    let requestVerificationToken = (document.querySelector('input[name="__RequestVerificationToken"][type="hidden"]') as HTMLInputElement).value

    let modPackTableBody = modPacksTable.tBodies[0];
    let fileTableBody = fileTable.tBodies[0];

    let renameOldName: string = null;
    let currentModPack: string = null;

    function buildModPackTable() {
        let cells = modPacksTable.tHead.rows[0].cells;

        cells[0].onclick = () => sortTable(modPacksTable, 'name');
        cells[1].onclick = () => sortTable(modPacksTable, 'lastModifiedTime');

        let jTable = $(modPacksTable);

        jTable.data('name', r => r.children[0].firstChild.textContent.toLowerCase());
        jTable.data('lastModifiedTime', r => r.children[1].textContent);

        jTable.data('sortProperty', 'lastModifiedTime');
        jTable.data('ascending', false);
    }

    function buildFileTable() {
        let cells = fileTable.tHead.rows[0].cells;


        let fileTableselectionCheckbox = cells[0].firstElementChild as HTMLInputElement;
        fileTableselectionCheckbox.onchange = () => {
            let checkboxes = fileTable.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;

            for (let checkbox of checkboxes) {
                checkbox.checked = fileTableselectionCheckbox.checked;
            }
        };

        cells[0].onclick = () => sortTable(fileTable, 'select');
        cells[1].onclick = () => sortTable(fileTable, 'name');
        cells[2].onclick = () => sortTable(fileTable, 'lastModifiedTime');
        cells[3].onclick = () => sortTable(fileTable, 'size');

        let jTable = $(fileTable);

        jTable.data('select', r => {
            let value = r.children[0].firstChild as HTMLInputElement;
            return value.checked ? 1 : 0;
        });

        jTable.data('name', r => r.children[1].firstChild.textContent.toLowerCase());
        jTable.data('lastModifiedTime', r => r.children[2].textContent);
        jTable.data('size', r => parseInt(r.children[3].getAttribute('data-size')));

        jTable.data('sortProperty', 'lastModifiedTime');
        jTable.data('ascending', false);
    }

    function onPageLoad() {
        buildModPackTable();
        buildFileTable();
    }

    onPageLoad();

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
        modPackTableBody.innerHTML = "";

        let rows: HTMLTableRowElement[] = []

        let currentModPackAvailable = false
        for (let modPack of modPacks) {
            let row = document.createElement('tr');
            row.onclick = modPackRowClick;

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
            deleteButton.onclick = showConfirmDeleteModPackModal;
            deleteButton.classList.add('button', 'is-danger');
            cell4.appendChild(deleteButton);
            row.appendChild(cell4);

            rows.push(row);

            if (currentModPack === modPack.Name) {
                currentModPackAvailable = true;
            }
        }

        if (!currentModPackAvailable) {
            currentModPack = null;
            modPackFilesDiv.classList.add('is-invisible');
        }

        let jTable = $(modPacksTable);

        jTable.data('rows', rows);

        let ascending = !jTable.data('ascending');
        jTable.data('ascending', ascending);
        let property = jTable.data('sortProperty');

        sortTable(modPacksTable, property);
    }

    function renameModPack(this: HTMLButtonElement, ev: MouseEvent) {
        ev.stopPropagation();

        let row = this.parentElement.parentElement;
        let child = row.firstElementChild as HTMLElement;
        let name = child.innerText

        renameOldName = name;

        renameModPackModal.classList.add('is-active');
        renameModPackModalOldNameLabel.innerText = name;
        renameModPackModalNameInput.value = name;
        renameModPackModalNameInput.focus();
    }

    function closeDeleteModPackModal() {
        deleteModPackModal.classList.remove('is-active');
    }

    deleteModPackModalBackground.onclick = closeDeleteModPackModal;
    deleteModPackModalCloseButton.onclick = closeDeleteModPackModal;
    deleteModPackModalCancelButton.onclick = closeDeleteModPackModal;
    deleteModPackModalConfirmButton.onclick = deleteModPack;

    function showConfirmDeleteModPackModal(this: HTMLButtonElement, ev: MouseEvent) {
        ev.stopPropagation();

        let row = this.parentElement.parentElement;
        let child = row.firstElementChild as HTMLElement;
        let name = child.innerText

        deleteModPackModal.classList.add('is-active');
        deleteModPackModalNameLabel.innerText = name;
    }

    async function deleteModPack(this: HTMLButtonElement, ev: MouseEvent) {
        let name = deleteModPackModalNameLabel.innerText

        let result = await connection.invoke('DeleteModPack', name) as Result;

        if (!result.Success) {
            alert(JSON.stringify(result.Errors));
        }

        closeDeleteModPackModal();
    }

    async function selectModPack(modPack: string) {
        currentModPack = modPack;
        currentModPackTitle.innerText = modPack;

        let files = await connection.invoke('GetModPackFiles', modPack) as ModPackFileMetaData[];

        updateModPackFiles(modPack, files);
    }

    function modPackRowClick(this: HTMLTableRowElement, ev: MouseEvent) {
        let child = this.firstElementChild as HTMLElement;
        let modPack = child.innerText

        selectModPack(modPack);
    }

    function updateModPackFiles(modPack: string, files: ModPackFileMetaData[]) {
        if (modPack === null) {
            modPackFilesDiv.classList.add('is-invisible');
            return;
        }

        modPackFilesDiv.classList.remove('is-invisible');

        let body = fileTableBody;
        body.innerHTML = "";

        let rows: HTMLTableRowElement[] = []

        for (let file of files) {
            let row = document.createElement('tr');

            let cell1 = document.createElement('td');
            let checkbox = document.createElement('input') as HTMLInputElement;
            checkbox.type = 'checkbox';
            checkbox.setAttribute('data-name', file.Name);
            cell1.appendChild(checkbox);
            row.appendChild(cell1);

            let cell2 = document.createElement('td');
            let link = document.createElement('a') as HTMLAnchorElement;
            link.innerText = file.Name;
            link.href = `/admin/mods?handler=file&modPack=${currentModPack}&fileName=${file.Name}`;
            cell2.appendChild(link);
            row.appendChild(cell2);

            let cell3 = document.createElement('td');
            cell3.innerText = formatDate(file.LastModifiedTime);
            row.appendChild(cell3);

            let cell4 = document.createElement('td');
            cell4.innerText = bytesToSize(file.Size);
            cell4.setAttribute('data-size', file.Size.toString());
            row.appendChild(cell4);

            rows.push(row);
        }

        let jTable = $(fileTable);

        jTable.data('rows', rows);

        let ascending = !jTable.data('ascending');
        jTable.data('ascending', ascending);
        let property = jTable.data('sortProperty');

        sortTable(fileTable, property);
    }

    function sendModPackFiles(modPack: string, files: ModPackFileMetaData[]) {
        if (modPack !== currentModPack) {
            return;
        }

        updateModPackFiles(modPack, files);
    }

    connection.on("SendModPacks", updateModPacks)

    connection.on("SendModPackFiles", sendModPackFiles)

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
        let current = currentModPack;

        let result = await connection.invoke('RenameModPack', renameOldName, name) as Result;

        if (result.Success) {
            closeRenameModPackModal();

            if (renameOldName === current) {
                selectModPack(name);
            }
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

    uploadFileButton.onclick = () => {
        uploadfileInput.click();
    }

    uploadfileInput.onchange = function (this: HTMLInputElement, ev: Event) {
        if (this.files.length == 0) {
            return;
        }

        let formData = new FormData();
        formData.set('modPack', currentModPack);

        let files = uploadfileInput.files
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }

        let xhr = new XMLHttpRequest();
        xhr.open('POST', '/admin/mods?handler=UploadFiles', true);
        xhr.setRequestHeader('RequestVerificationToken', requestVerificationToken);

        xhr.upload.addEventListener('loadstart', function (event) {
            fileProgressContiner.hidden = false;
            fileProgress.value = 0;
        }, false);

        xhr.upload.addEventListener("progress", function (event) {
            fileProgress.value = event.loaded / event.total;
        }, false);

        xhr.onloadend = function (event) {
            fileProgressContiner.hidden = true;

            var result = JSON.parse(xhr.responseText) as Result;
            if (!result.Success) {
                console.log(result);
                alert(JSON.stringify(result.Errors))
            }
        }

        xhr.send(formData);

        uploadfileInput.value = "";
    }

    deleteFileButton.onclick = async () => {
        let checkboxes = document.querySelectorAll('input[type=checkbox]:checked');

        if (checkboxes.length == 0) {
            alert('Please select files to delete.');
            return;
        }

        let files = [];

        for (let checkbox of checkboxes) {
            let name = checkbox.getAttribute('data-name');
            if (name !== null) {
                files.push(name);
            }
        }

        let result: Result = await connection.invoke('DeleteModPackFiles', currentModPack, files);

        if (!result.Success) {
            alert(JSON.stringify(result.Errors));
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

    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    function bytesToSize(bytes: number) {
        // https://gist.github.com/lanqy/5193417

        if (bytes === 0)
            return 'n/a';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        if (i === 0)
            return `${bytes} ${sizes[i]}`;
        else
            return `${(bytes / (1024 ** i)).toFixed(1)} ${sizes[i]}`;
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