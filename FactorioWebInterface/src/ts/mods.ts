import * as signalR from "@microsoft/signalr";
import { MessagePackHubProtocol } from "@microsoft/signalr-protocol-msgpack";
import { Result, Utils, CollectionChangedData } from "./utils";
import * as Table from "./table";

(function () {
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

    const modPacksTableElement = document.getElementById('modPacksTable') as HTMLTableElement;
    const newModPackButton = document.getElementById('newModPackButton') as HTMLButtonElement;
    const modPackFilesDiv = document.getElementById('modPackFilesDiv') as HTMLDivElement;

    const currentModPackTitle = document.getElementById('currentModPackTitle') as HTMLHeadingElement;
    const fileTableElement = document.getElementById('fileTable') as HTMLTableElement;
    const uploadfileInput = document.getElementById('uploadfileInput') as HTMLInputElement;
    const uploadFileButton = document.getElementById('uploadFileButton') as HTMLButtonElement;
    const modPortalInput = document.getElementById('modPortalInput') as HTMLInputElement;
    const modPortalButton = document.getElementById('modPortalButton') as HTMLButtonElement;
    const fileProgress = document.getElementById('fileProgress') as HTMLProgressElement;
    const modPortalProgress = document.getElementById('modPortalProgress') as HTMLProgressElement;
    const fileProgressContiner = document.getElementById('fileProgressContiner') as HTMLSpanElement;
    const modPortalProgressContiner = document.getElementById('modPortalProgressContiner') as HTMLSpanElement;
    const deleteFileButton = document.getElementById('deleteFileButton') as HTMLButtonElement;
    const copyFileButton = document.getElementById('copyFileButton') as HTMLButtonElement;
    const moveFileButton = document.getElementById('moveFileButton') as HTMLButtonElement;
    const destinationSelect = document.getElementById('destinationSelect') as HTMLSelectElement;

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

    let modPacksTable: Table.Table<ModPackMetaData>;
    let fileTable: Table.Table<ModPackFileMetaData>;

    let renameOldName: string = null;
    let currentModPack: string = null;

    const connection = new signalR.HubConnectionBuilder()
        .withUrl("/factorioModHub")
        .withHubProtocol(new MessagePackHubProtocol())
        .build();

    function buildTextCell(cell: HTMLTableCellElement, data: any) {
        cell.innerText = data;
    }

    function buildDateCell(cell: HTMLTableCellElement, data: any) {
        cell.innerText = Utils.formatDate(data);
    }

    function sortTextCell(cell: HTMLTableCellElement) {
        return cell.textContent.toLowerCase();
    }

    function sortDateCell(cell: HTMLTableCellElement) {
        return cell.textContent;
    }

    function buildModPackTable() {
        function onRowClicked(this: HTMLTableRowElement, ev: MouseEvent) {
            let child = this.firstElementChild as HTMLElement;
            let modPack = child.innerText

            selectModPack(modPack);
        }

        function createIconButton(text: string, iconCss: string) {
            let button = document.createElement('button');

            let icon = document.createElement('span');
            icon.classList.add('icon');
            button.appendChild(icon);

            let iconInner = document.createElement('i');
            iconInner.classList.add('fas', iconCss);
            icon.appendChild(iconInner);

            let buttonText = document.createElement('span');
            buttonText.innerText = text;
            button.appendChild(buttonText);

            return button;
        }

        function buildRenameCell(cell: HTMLTableCellElement, data: any) {
            let button = createIconButton('Rename', 'fa-edit')

            button.onclick = renameModPack;
            button.classList.add('button', 'is-link');
            cell.appendChild(button);
        }

        function buildDeleteCell(cell: HTMLTableCellElement, data: any) {
            let button = createIconButton('Delete', 'fa-trash')

            button.onclick = showConfirmDeleteModPackModal;
            button.classList.add('button', 'is-danger');
            cell.appendChild(button);
        }

        let cellBuilders: Table.CellBuilder[] = [
            {
                Property: 'Name',
                CellBuilder: buildTextCell,
                SortKeySelector: sortTextCell,
                IsKey: true
            },
            {
                Property: 'LastModifiedTime',
                CellBuilder: buildDateCell,
                SortKeySelector: sortDateCell
            },
            {
                Property: 'Rename',
                CellBuilder: buildRenameCell,
            },
            {
                Property: 'Delete',
                CellBuilder: buildDeleteCell,
            }
        ];

        modPacksTable = new Table.Table<ModPackMetaData>(modPacksTableElement, cellBuilders, onRowClicked)
        modPacksTable.sortBy(1, false);
    }

    function buildFileTable() {
        function buildCheckboxCell(cell: HTMLTableCellElement, data: string) {
            let checkbox = document.createElement('input') as HTMLInputElement;
            checkbox.type = 'checkbox';
            checkbox.setAttribute('data-name', data);
            cell.appendChild(checkbox);
        }

        function buildNameCell(cell: HTMLTableCellElement, data: string) {
            let link = document.createElement('a') as HTMLAnchorElement;
            link.innerText = data;
            link.href = `/admin/mods?handler=file&modPack=${encodeURIComponent(currentModPack)}&fileName=${encodeURIComponent(data)}`;
            cell.appendChild(link);
        }

        function buildSizeCell(cell: HTMLTableCellElement, data: number) {
            cell.innerText = Utils.bytesToSize(data);
            cell.setAttribute('data-size', data.toString());
        }

        function sortNameCell(cell: HTMLTableCellElement) {
            return cell.firstElementChild.textContent.toLowerCase();
        }

        function sortCheckboxCell(cell: HTMLTableCellElement) {
            let checkbox = cell.firstElementChild as HTMLInputElement;
            return checkbox.checked ? 1 : 0;
        }

        function sortSizeCell(cell: HTMLTableCellElement) {
            return Number.parseInt(cell.getAttribute('data-size'));
        }

        function buildCheckboxHeader(cell: HTMLTableHeaderCellElement, symbol: string) {
            cell.childNodes[1].textContent = ' Select' + symbol;
        }

        let cellBuilders: Table.CellBuilder[] = [
            {
                Property: 'Name',
                CellBuilder: buildCheckboxCell,
                SortKeySelector: sortCheckboxCell,
                HeaderBuilder: buildCheckboxHeader
            },
            {
                Property: 'Name',
                CellBuilder: buildNameCell,
                SortKeySelector: sortNameCell,
                IsKey: true
            },
            {
                Property: 'LastModifiedTime',
                CellBuilder: buildDateCell,
                SortKeySelector: sortDateCell
            },
            {
                Property: 'Size',
                CellBuilder: buildSizeCell,
                SortKeySelector: sortSizeCell
            }
        ];

        fileTable = new Table.Table<ModPackFileMetaData>(fileTableElement, cellBuilders)
        fileTable.sortBy(2, false);

        let fileTableselectionCheckbox = fileTableElement.tHead.rows[0].cells[0].firstElementChild as HTMLInputElement;
        fileTableselectionCheckbox.onchange = () => {
            let checkboxes = fileTableElement.tBodies[0].querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;

            for (let checkbox of checkboxes) {
                checkbox.checked = fileTableselectionCheckbox.checked;
            }
        };

        fileTableselectionCheckbox.onclick = function (this, ev: MouseEvent) {
            ev.stopPropagation();
        }
    }

    function selectModPack(modPack: string) {
        connection.invoke('RequestModPackFiles', modPack);

        currentModPack = modPack;
        currentModPackTitle.innerText = modPack;
        fileTable.clear();
        modPackFilesDiv.classList.remove('is-invisible');
    }

    function renameModPack(this: HTMLButtonElement, ev: MouseEvent) {
        ev.stopPropagation();

        let row = this.parentElement.parentElement;
        let child = row.firstElementChild as HTMLElement;
        let name = child.innerText;

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
            uploadFileButton.disabled = false;

            var result = JSON.parse(xhr.responseText) as Result;
            if (!result.Success) {
                console.log(result);
                alert(JSON.stringify(result.Errors))
            }
        }

        xhr.send(formData);

        uploadfileInput.value = "";
        uploadFileButton.disabled = true;
    }

    modPortalButton.onclick = () => {
        modPortalInput.click();
    }

    modPortalInput.onchange = function (this: HTMLInputElement, ev: Event) {
        if (this.files.length == 0) {
            return;
        }

        let fileNames: string[] = [];

        let files = modPortalInput.files
        for (let i = 0; i < files.length; i++) {
            fileNames.push(files[i].name);
        }

        modPortalProgressContiner.hidden = false;
        modPortalButton.disabled = true;
        uploadfileInput.value = "";

        connection.send('DownloadFromModPortal', currentModPack, fileNames);
    }

    deleteFileButton.onclick = async () => {
        let checkboxes = fileTableElement.tBodies[0].querySelectorAll('input[type=checkbox]:checked');

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

    copyFileButton.onclick = async () => {
        let checkboxes = fileTableElement.tBodies[0].querySelectorAll('input[type=checkbox]:checked');

        if (checkboxes.length == 0) {
            alert('Please select files to copy.');
            return;
        }

        let files = [];

        for (let checkbox of checkboxes) {
            let name = checkbox.getAttribute('data-name');
            if (name !== null) {
                files.push(name);
            }
        }

        let targetModPack = destinationSelect.value;

        if (targetModPack === '') {
            alert('Please select a destination to copy files to.');
            return;
        }

        if (targetModPack === currentModPack) {
            alert('Destination mod pack must be different to source mod pack.');
            return;
        }

        let result: Result = await connection.invoke('CopyModPackFiles', currentModPack, targetModPack, files);

        if (!result.Success) {
            alert(JSON.stringify(result.Errors));
        }
    }

    moveFileButton.onclick = async () => {
        let checkboxes = fileTableElement.tBodies[0].querySelectorAll('input[type=checkbox]:checked');

        if (checkboxes.length == 0) {
            alert('Please select files to move.');
            return;
        }

        let files = [];

        for (let checkbox of checkboxes) {
            let name = checkbox.getAttribute('data-name');
            if (name !== null) {
                files.push(name);
            }
        }

        let targetModPack = destinationSelect.value;

        if (targetModPack === '') {
            alert('Please select a destination to move files to.');
            return;
        }

        if (targetModPack === currentModPack) {
            alert('Destination mod pack must be different to source mod pack.');
            return;
        }

        let result: Result = await connection.invoke('MoveModPackFiles', currentModPack, targetModPack, files);

        if (!result.Success) {
            alert(JSON.stringify(result.Errors));
        }
    }

    function updatePage() {
        connection.invoke('RequestModPacks');

        if (currentModPack !== null) {
            connection.invoke('RequestModPackFiles', currentModPack);
        }

        modPortalProgressContiner.hidden = true;
        modPortalButton.disabled = false;
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

    connection.onclose(async () => {
        await startConnection();
    });

    connection.on("SendModPacks", (data: CollectionChangedData<ModPackMetaData>) => {
        modPacksTable.update(data);

        let selectedDestination = destinationSelect.value;

        destinationSelect.innerHTML = '';
        for (let row of modPacksTable.rows()) {
            let name = row.cells[0].textContent;

            let option = document.createElement('option');
            option.textContent = name;
            destinationSelect.appendChild(option);
        }

        if (selectedDestination !== '') {
            destinationSelect.value = selectedDestination;
        }
        if (destinationSelect.selectedIndex === -1) {
            destinationSelect.selectedIndex = 0;
        }

        let currentModPackAvailable = false;
        for (let row of modPacksTable.rows()) {
            if (currentModPack === row.cells[0].textContent) {
                currentModPackAvailable = true;
                break;
            }
        }

        if (!currentModPackAvailable) {
            currentModPack = null;
            modPackFilesDiv.classList.add('is-invisible');
        }
    });

    connection.on("SendModPackFiles", (modPack: string, data: CollectionChangedData<ModPackFileMetaData>) => {
        if (currentModPack === modPack) {
            fileTable.update(data);
        }
    });

    connection.on("EndDownloadFromModPortal", (result: Result) => {
        modPortalProgressContiner.hidden = true;
        modPortalButton.disabled = false;

        if (!result.Success) {
            alert(JSON.stringify(result.Errors));
        }
    });

    function onPageLoad() {
        buildModPackTable();
        buildFileTable();
        startConnection();
    }

    onPageLoad();
})();