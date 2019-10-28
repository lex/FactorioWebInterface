import * as signalR from "@aspnet/signalr";
import { MessagePackHubProtocol } from "@aspnet/signalr-protocol-msgpack";
import * as Table from "./table";
import { Error, Result, Utils, CollectionChangedData, CollectionChangeType, KeyValueCollectionChangedData } from "./utils";

!function () {

    enum MessageType {
        Output = "Output",
        Wrapper = "Wrapper",
        Control = "Control",
        Status = "Status",
        Discord = "Discord",
        Error = "Error"
    }

    interface MessageData {
        ServerId: string;
        MessageType: MessageType;
        Message: string;
    }

    interface FileMetaData {
        Name: string;
        Directory: string;
        CreatedTime: string;
        LastModifiedTime: string;
        Size: number;
    }

    interface ScenarioMetaData {
        Name: string;
        CreatedTime: string;
        LastModifiedTime: string;
    }

    interface ModPackMetaData {
        Name: string;
        CreatedTime: string;
        LastModifiedTime: string;
    }

    interface FactorioContorlClientData {
        Status: string;
        Messages: MessageData[];
    }

    interface FactorioServerSettings {
        Name: string;
        Description: string;
        Tags: string[];
        MaxPlayers: number;
        GamePassword: string;
        MaxUploadSlots: number;
        AutoPause: boolean;
        UseDefaultAdmins: boolean;
        Admins: string[];
        AutosaveInterval: number;
        AutosaveSlots: number;
        NonBlockingSaving: boolean;
        PublicVisible: boolean;
    }

    type FactorioServerSettingsType = keyof FactorioServerSettings;

    interface FactorioServerExtraSettings {
        SyncBans: boolean;
        BuildBansFromDatabaseOnStart: boolean;
        SetDiscordChannelName: boolean;
        GameChatToDiscord: boolean;
        GameShoutToDiscord: boolean;
        DiscordToGameChat: boolean;
    }

    type FactorioServerExtraSettingsType = keyof FactorioServerExtraSettings;

    const divMessages: HTMLDivElement = document.querySelector("#divMessages");
    const tbMessage: HTMLInputElement = document.querySelector("#tbMessage");
    const btnSend: HTMLButtonElement = document.querySelector("#btnSend");
    const serverName = document.getElementById('serverName') as HTMLHeadingElement;
    const serverSelect = document.getElementById('serverSelect') as HTMLSelectElement;
    const resumeButton: HTMLButtonElement = document.getElementById('resumeButton') as HTMLButtonElement;
    const loadButton: HTMLButtonElement = document.getElementById('loadButton') as HTMLButtonElement;
    const startScenarioButton: HTMLButtonElement = document.getElementById('startScenarioButton') as HTMLButtonElement;
    const stopButton: HTMLButtonElement = document.getElementById('stopButton') as HTMLButtonElement;
    const saveButton: HTMLButtonElement = document.getElementById('saveButton') as HTMLButtonElement;
    const updateButton: HTMLButtonElement = document.getElementById('updateButton') as HTMLButtonElement;
    const forceStopButton: HTMLButtonElement = document.getElementById('forceStopButton') as HTMLButtonElement;
    const getStatusButton: HTMLButtonElement = document.getElementById('getStatusButton') as HTMLButtonElement;
    const statusText: HTMLLabelElement = document.getElementById('statusText') as HTMLLabelElement;
    const versionText: HTMLLabelElement = document.getElementById('versionText') as HTMLLabelElement;

    const tempSaveFilesTableElement = document.getElementById('tempSaveFilesTable') as HTMLTableElement;
    const localSaveFilesTableElement = document.getElementById('localSaveFilesTable') as HTMLTableElement;
    const globalSaveFilesTableElement = document.getElementById('globalSaveFilesTable') as HTMLTableElement;
    const scenarioTableElement = document.getElementById('scenarioTable') as HTMLTableElement;
    const modPackTableElement = document.getElementById('modPackTable') as HTMLTableElement;
    const logsFileTableElement = document.getElementById('logsFileTable') as HTMLTableElement;
    const chatLogsFileTableElement = document.getElementById('chatLogsFileTable') as HTMLTableElement;

    const updateModal = document.getElementById('updateModal') as HTMLDivElement;
    const closeModalButton = document.getElementById('closeModalButton') as HTMLButtonElement;
    const modalBackground = document.getElementById('modalBackground') as HTMLDivElement;
    const updateSelect = document.getElementById('updateSelect') as HTMLSelectElement;
    const downloadAndUpdateButton = document.getElementById('downloadAndUpdateButton') as HTMLButtonElement;
    const cachedVersionsTableElement = document.getElementById('cachedVersionsTable') as HTMLTableElement;

    // XSRF/CSRF token, see https://docs.microsoft.com/en-us/aspnet/core/security/anti-request-forgery?view=aspnetcore-2.1
    let requestVerificationToken = (document.querySelector('input[name="__RequestVerificationToken"][type="hidden"]') as HTMLInputElement).value

    const fileUploadInput = document.getElementById('fileUploadInput') as HTMLInputElement;
    const fileUplaodButton = document.getElementById('fileUploadButton') as HTMLButtonElement;
    const fileDeleteButton = document.getElementById('fileDeleteButton') as HTMLButtonElement;
    const fileMoveButton = document.getElementById('fileMoveButton') as HTMLButtonElement;
    const fileCopyButton = document.getElementById('fileCopyButton') as HTMLButtonElement;
    const destinationSelect = document.getElementById('destinationSelect') as HTMLSelectElement;
    const saveRenameButton = document.getElementById('saveRenameButton') as HTMLButtonElement;
    const saveDeflateButton = document.getElementById('saveDeflateButton') as HTMLButtonElement;
    const fileRenameInput = document.getElementById('fileRenameInput') as HTMLInputElement;
    const fileProgress = document.getElementById('fileProgress') as HTMLProgressElement;
    const fileProgressContiner = document.getElementById('fileProgressContiner') as HTMLSpanElement;
    const deflateProgress = document.getElementById('deflateProgress') as HTMLSpanElement;

    const settingsBox = document.getElementById('settingsBox') as HTMLDivElement;
    const settingsUnsavedLabel = document.getElementById('settingsUnsavedLabel') as HTMLLabelElement;
    const configNameInput = document.getElementById('configNameInput') as HTMLInputElement;
    const configDescriptionInput = document.getElementById('configDescriptionInput') as HTMLInputElement;
    const configTagsInput = document.getElementById('configTagsInput') as HTMLTextAreaElement;
    const configMaxPlayersInput = document.getElementById('configMaxPlayersInput') as HTMLInputElement;
    const configPasswordInput = document.getElementById('configPasswordInput') as HTMLInputElement;
    const configMaxUploadSlots = document.getElementById('configMaxUploadSlots') as HTMLInputElement;
    const configPauseInput = document.getElementById('configPauseInput') as HTMLInputElement;
    const configAdminUseDefault = document.getElementById('configAdminUseDefault') as HTMLInputElement;
    const configAdminInput = document.getElementById('configAdminInput') as HTMLTextAreaElement;
    const configAutoSaveIntervalInput = document.getElementById('configAutoSaveIntervalInput') as HTMLInputElement;
    const configAutoSaveSlotsInput = document.getElementById('configAutoSaveSlotsInput') as HTMLInputElement;
    const configNonBlockingSavingInput = document.getElementById('configNonBlockingSavingInput') as HTMLInputElement;
    const configPublicVisibleInput = document.getElementById('configPublicVisibleInput') as HTMLInputElement;
    const configSyncBans = document.getElementById('configSyncBans') as HTMLInputElement;
    const configBuildBansFromDb = document.getElementById('configBuildBansFromDb') as HTMLInputElement;
    const configSetDiscordChannelName = document.getElementById('configSetDiscordChannelName') as HTMLInputElement;
    const configSaveButton = document.getElementById('configSaveButton') as HTMLButtonElement;
    const undoSettingsButton = document.getElementById('undoSettingsButton') as HTMLButtonElement;
    const copySettingsButton = document.getElementById('copySettingsButton') as HTMLButtonElement;
    const pasteSettingsTextInput = document.getElementById('pasteSettingsTextInput') as HTMLInputElement;

    const extraSettingsBox = document.getElementById('extraSettingsBox') as HTMLDivElement;
    const extraSettingsUnsavedLabel = document.getElementById('extraSettingsUnsavedLabel') as HTMLLabelElement;
    const configSetGameChatToDiscord = document.getElementById('configSetGameChatToDiscord') as HTMLInputElement;
    const configSetGameShoutToDiscord = document.getElementById('configSetGameShoutToDiscord') as HTMLInputElement;
    const configSetDiscordToGameChat = document.getElementById('configSetDiscordToGameChat') as HTMLInputElement;
    const configExtraSaveButton = document.getElementById('configExtraSaveButton') as HTMLButtonElement;
    const undoExtraSettingsButton = document.getElementById('undoExtraSettingsButton') as HTMLButtonElement;
    const copyExtraSettingsButton = document.getElementById('copyExtraSettingsButton') as HTMLButtonElement;
    const pasteExtraSettingsTextInput = document.getElementById('pasteExtraSettingsTextInput') as HTMLInputElement;

    let tempSaveFilesTable: Table.Table;
    let localSaveFilesTable: Table.Table;
    let globalSaveFilesTable: Table.Table;
    let scenarioTable: Table.Table;
    let logsFileTable: Table.Table;
    let chatLogsFileTable: Table.Table;
    let modPackTable: Table.Table;
    let cachedVersionsTable: Table.Table;

    const maxMessageCount = 200;

    let messageCount = 0;
    let commandHistory: string[] = [];
    let commandHistoryIndex = 0;

    let selectedModPack = "";

    const connection = new signalR.HubConnectionBuilder()
        .withUrl("/factorioControlHub")
        .withHubProtocol(new MessagePackHubProtocol())
        .build();

    function getFiles() {
        connection.send('RequestTempSaveFiles');
        connection.send('RequestLocalSaveFiles');
        connection.send('RequestLogFiles');
        connection.send('RequestChatLogFiles');
    }

    function getSettings() {
        connection.send('RequestServerSettings');
        connection.send('RequestServerExtraSettings');
    }

    async function getVersion() {
        versionText.textContent = await connection.invoke('GetVersion')
    }

    function getSelectedModPack() {
        connection.send('RequestSelectedModPack');
    }

    async function updateLocalPageData() {
        let promise = connection.invoke('SetServerId', serverSelect.value);

        messageCount = 0;
        divMessages.innerHTML = "";

        getFiles();
        getSettings();
        getVersion();
        getSelectedModPack();

        let data = await promise as FactorioContorlClientData;

        statusText.innerText = data.Status;

        for (let message of data.Messages) {
            writeMessage(message);
        }
    }

    function updateGlobalPageData() {
        connection.send('RequestGlobalSaveFiles');
        connection.send('RequestScenarios');
        connection.send('RequestModPacks');
    }

    async function startConnection() {
        try {
            await connection.start();

            updateLocalPageData();
            updateGlobalPageData();
        } catch (ex) {
            console.log(ex.message);
            setTimeout(() => startConnection(), 2000);
        }
    }

    connection.onclose(async () => {
        await startConnection();
    });

    serverSelect.onchange = function (this: HTMLSelectElement) {
        let value = this.value;
        history.pushState({ value: value }, '', `/admin/servers/${value}`);
        updateLocalPageData();
    };

    onpopstate = function (e) {
        let state = e.state;

        if (state) {
            serverSelect.value = state.value;
            updateLocalPageData();
        }
    };

    function mod(n: number, m: number) {
        return ((n % m) + m) % m;
    }

    function rotateCommand(offset: number) {
        let newIndex = mod(commandHistoryIndex + offset, commandHistory.length);

        commandHistoryIndex = newIndex;
        tbMessage.value = commandHistory[newIndex];
    }

    tbMessage.addEventListener("keyup", (e: KeyboardEvent) => {
        let key = e.keyCode;

        if (key === 13) { // enter
            send();
        } else if (key === 38) { // up
            rotateCommand(-1);
        } else if (key === 40) { // down
            rotateCommand(1);
        }
    });

    btnSend.addEventListener("click", send);

    async function send() {
        let message = tbMessage.value;
        if (message === '') {
            return;
        }

        tbMessage.value = '';

        if (commandHistoryIndex === commandHistory.length || commandHistory[commandHistoryIndex] !== message) {
            commandHistory.push(message);
        } else {
            let removed = commandHistory.splice(commandHistoryIndex, 1);
            commandHistory.push(removed[0]);
        }

        commandHistoryIndex = commandHistory.length;

        await connection.send("SendToFactorio", message);
    }

    resumeButton.onclick = () => {
        connection.invoke("Resume")
            .then((result: Result) => {
                if (!result.Success) {
                    alert(JSON.stringify(result.Errors));
                }
            });
    }

    loadButton.onclick = () => {
        let checkboxes = document.querySelectorAll('input[name="fileCheckbox"]:checked');

        if (checkboxes.length != 1) {
            alert('Select one file to load.');
            return;
        }

        let checkbox = checkboxes[0];
        let dir = checkbox.getAttribute('data-directory');
        let name = checkbox.getAttribute('data-name');

        connection.invoke("Load", dir, name)
            .then((result: Result) => {
                if (!result.Success) {
                    alert(JSON.stringify(result.Errors));
                }
            });
    }

    startScenarioButton.onclick = () => {
        let checkboxes = document.querySelectorAll('input[name="scenarioCheckbox"]:checked');

        if (checkboxes.length != 1) {
            alert('Select one scenario to start.');
            return;
        }

        let checkbox = checkboxes[0];
        let name = checkbox.getAttribute('data-name');

        connection.invoke("StartScenario", name)
            .then((result: Result) => {
                if (!result.Success) {
                    alert(JSON.stringify(result.Errors));
                }
            });
    }

    stopButton.onclick = () => {
        connection.invoke("Stop")
            .then((result: Result) => {
                if (!result.Success) {
                    alert(JSON.stringify(result.Errors));
                }
            });
    }

    saveButton.onclick = () => {
        connection.invoke("Save")
            .then((result: Result) => {
                if (!result.Success) {
                    alert(JSON.stringify(result.Errors));
                }
            });
    };

    async function install(version: string) {
        let result: Result = await connection.invoke("Update", version);

        if (!result.Success) {
            alert(JSON.stringify(result.Errors));
        }
    }

    updateButton.onclick = () => {
        connection.send('RequestDownloadableVersions');
        connection.send('RequestCachedVersions');

        updateModal.classList.add('is-active');
        updateSelect.parentElement.classList.add('is-loading');
    };

    function closeModal() {
        updateModal.classList.remove('is-active');
    }

    modalBackground.onclick = closeModal;
    closeModalButton.onclick = closeModal;

    downloadAndUpdateButton.onclick = () => {
        install(updateSelect.value);
        closeModal();
    };

    forceStopButton.onclick = () => {
        connection.invoke("ForceStop")
            .then((result: Result) => {
                if (!result.Success) {
                    alert(JSON.stringify(result.Errors));
                }
            });
    }

    getStatusButton.onclick = () => {
        connection.invoke("GetStatus");
    }

    function writeMessage(message: MessageData): void {
        let serverId = message.ServerId;
        if (serverId !== serverSelect.value) {
            console.log(message);
            return;
        }

        let div = document.createElement("div");
        let data: string;

        switch (message.MessageType) {
            case MessageType.Output:
                data = message.Message;
                break;
            case MessageType.Wrapper:
                data = `[Wrapper] ${message.Message}`;
                break;
            case MessageType.Control:
                div.classList.add('has-background-warning');
                data = `[Control] ${message.Message}`;
                break;
            case MessageType.Discord:
                data = message.Message;
                break;
            case MessageType.Status:
                div.classList.add('has-background-info', 'has-text-white');
                data = message.Message;
                break;
            case MessageType.Error:
                div.classList.add('has-background-danger', 'has-text-white');
                data = `[Error] ${message.Message}`;
                break;
            default:
                data = "";
                break;
        }

        div.innerText = data;

        let left = window.scrollX;
        let top = window.scrollY;

        if (messageCount === maxMessageCount) {
            let first = divMessages.firstChild
            divMessages.removeChild(first);
        } else {
            messageCount++;
        }

        if (divMessages.scrollTop + divMessages.clientHeight >= divMessages.scrollHeight) {
            divMessages.appendChild(div);
            divMessages.scrollTop = divMessages.scrollHeight;
        } else {
            divMessages.appendChild(div);
        }

        window.scrollTo(left, top);
    }

    function buildTextCell(cell: HTMLTableCellElement, data: any) {
        cell.innerText = data;
    }

    function buildDateCell(cell: HTMLTableCellElement, data: any) {
        cell.innerText = Utils.formatDate(data);
    }

    function buildSizeCell(cell: HTMLTableCellElement, data: number) {
        cell.innerText = Utils.bytesToSize(data);
        cell.setAttribute('data-size', data.toString());
    }

    function sortTextCell(cell: HTMLTableCellElement) {
        return cell.textContent.toLowerCase();
    }

    function sortDateCell(cell: HTMLTableCellElement) {
        return cell.textContent;
    }

    function sortSizeCell(cell: HTMLTableCellElement) {
        return Number.parseInt(cell.getAttribute('data-size'));
    }

    function toggleSelectTable(tableBody: HTMLTableSectionElement, checked: boolean) {
        let checkboxes = tableBody.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;

        for (let checkbox of checkboxes) {
            checkbox.checked = checked;
        }
    }

    function buildFileTable(tableElement: HTMLTableElement): Table.Table {
        function buildCheckboxCell(cell: HTMLTableCellElement, data: FileMetaData, oldCell: HTMLTableCellElement) {
            let wasChecked;
            if (oldCell) {
                let oldCheckbox = oldCell.firstElementChild as HTMLInputElement;
                wasChecked = oldCheckbox.checked
            } else {
                wasChecked = false;
            }

            let checkbox = document.createElement('input') as HTMLInputElement;
            checkbox.type = 'checkbox';
            checkbox.name = 'fileCheckbox';
            checkbox.setAttribute('data-directory', data.Directory);
            checkbox.setAttribute('data-name', data.Name);
            checkbox.checked = wasChecked;
            cell.appendChild(checkbox);
        }

        function buildNameCell(cell: HTMLTableCellElement, data: FileMetaData) {
            let link = document.createElement('a') as HTMLAnchorElement;
            link.innerText = data.Name;
            link.href = `/admin/servers?handler=file&serverId=${serverSelect.value}&directory=${data.Directory}&name=${data.Name}`;
            cell.appendChild(link);
        }

        function sortNameCell(cell: HTMLTableCellElement) {
            return cell.firstElementChild.textContent.toLowerCase();
        }

        function sortCheckboxCell(cell: HTMLTableCellElement) {
            let checkbox = cell.firstElementChild as HTMLInputElement;
            return checkbox.checked ? 1 : 0;
        }

        function buildCheckboxHeader(cell: HTMLTableHeaderCellElement, symbol: string) {
            cell.childNodes[1].textContent = ' Select' + symbol;
        }

        let cellBuilders: Table.CellBuilder[] = [
            {
                CellBuilder: buildCheckboxCell,
                SortKeySelector: sortCheckboxCell,
                HeaderBuilder: buildCheckboxHeader
            },
            {
                CellBuilder: buildNameCell,
                SortKeySelector: sortNameCell,
            },
            {
                Property: "LastModifiedTime",
                CellBuilder: buildDateCell,
                SortKeySelector: sortDateCell,
            },
            {
                Property: "Size",
                CellBuilder: buildSizeCell,
                SortKeySelector: sortSizeCell,
            }
        ];

        function keySelector(data: FileMetaData) {
            return data.Name;
        }

        let table = new Table.Table(tableElement, cellBuilders, undefined, keySelector);
        table.sortBy(2, false);

        let select = tableElement.tHead.rows[0].cells[0].firstElementChild as HTMLInputElement;
        select.onchange = () => toggleSelectTable(tableElement.tBodies[0], select.checked);
        select.onclick = function (this, ev: MouseEvent) {
            ev.stopPropagation();
        }

        return table;
    }

    function buildLogFileTable(tableElement: HTMLTableElement, handler: string): Table.Table {
        function buildNameCell(cell: HTMLTableCellElement, data: FileMetaData) {
            let link = document.createElement('a') as HTMLAnchorElement;
            link.innerText = data.Name;
            link.href = `/admin/servers?handler=${handler}&directory=${data.Directory}&name=${data.Name}`;
            cell.appendChild(link);
        }

        function sortNameCell(cell: HTMLTableCellElement) {
            return cell.firstElementChild.textContent.toLowerCase();
        }

        let cellBuilders: Table.CellBuilder[] = [
            {
                CellBuilder: buildNameCell,
                SortKeySelector: sortNameCell,
            },
            {
                Property: "LastModifiedTime",
                CellBuilder: buildDateCell,
                SortKeySelector: sortDateCell,
            },
            {
                Property: "Size",
                CellBuilder: buildSizeCell,
                SortKeySelector: sortSizeCell,
            }
        ];

        function keySelector(data: FileMetaData) {
            return data.Name;
        }

        let table = new Table.Table(tableElement, cellBuilders, undefined, keySelector);
        table.sortBy(1, false);

        return table;
    }

    function buildScenarioTable(tableElement: HTMLTableElement): Table.Table {
        function buildCheckboxCell(cell: HTMLTableCellElement, data: ScenarioMetaData) {
            let checkbox = document.createElement('input') as HTMLInputElement;
            checkbox.type = 'checkbox';
            checkbox.name = 'scenarioCheckbox';
            checkbox.setAttribute('data-name', data.Name);
            cell.appendChild(checkbox);
        }

        function sortCheckboxCell(cell: HTMLTableCellElement) {
            let checkbox = cell.firstElementChild as HTMLInputElement;
            return checkbox.checked ? 1 : 0;
        }

        function buildCheckboxHeader(cell: HTMLTableHeaderCellElement, symbol: string) {
            cell.childNodes[1].textContent = ' Select' + symbol;
        }

        let cellBuilders: Table.CellBuilder[] = [
            {
                CellBuilder: buildCheckboxCell,
                SortKeySelector: sortCheckboxCell,
                HeaderBuilder: buildCheckboxHeader
            },
            {
                Property: 'Name',
                CellBuilder: buildTextCell,
                SortKeySelector: sortTextCell,
                IsKey: true
            },
            {
                Property: "LastModifiedTime",
                CellBuilder: buildDateCell,
                SortKeySelector: sortDateCell,
            }
        ];

        let table = new Table.Table(tableElement, cellBuilders);
        table.sortBy(2, false);

        let select = tableElement.tHead.rows[0].cells[0].firstElementChild as HTMLInputElement;
        select.onchange = () => toggleSelectTable(tableElement.tBodies[0], select.checked);
        select.onclick = function (this, ev: MouseEvent) {
            ev.stopPropagation();
        }

        return table;
    }

    function buildModPackTable(tableElement: HTMLTableElement) {
        function buildRadioCell(cell: HTMLTableCellElement, data: ModPackMetaData) {
            let radio = document.createElement('input') as HTMLInputElement;
            radio.type = 'radio';
            radio.name = 'modPack';
            radio.value = data.Name;
            radio.checked = selectedModPack === data.Name;
            radio.onchange = modPackSelected;
            cell.appendChild(radio);
        }

        function buildNameCell(cell: HTMLTableCellElement, data: string) {
            if (data === "") {
                data = 'Vanilla (no mods)';
            }

            cell.innerText = data;
        }

        function buildModPackDateCell(cell: HTMLTableCellElement, data: ModPackMetaData) {
            if (data.Name === "") {
                buildTextCell(cell, 'N/A');
            } else {
                buildDateCell(cell, data.LastModifiedTime);
            }
        }

        function sortRadioCell(cell: HTMLTableCellElement) {
            let checkbox = cell.firstElementChild as HTMLInputElement;
            return checkbox.checked ? 1 : 0;
        }

        let cellBuilders: Table.CellBuilder[] = [
            {
                CellBuilder: buildRadioCell,
                SortKeySelector: sortRadioCell,
            },
            {
                Property: 'Name',
                CellBuilder: buildNameCell,
                SortKeySelector: sortTextCell,
            },
            {
                CellBuilder: buildModPackDateCell,
                SortKeySelector: sortDateCell,
            }
        ];

        function keySelector(data: FileMetaData) {
            return data.Name;
        }

        let table = new Table.Table(tableElement, cellBuilders, undefined, keySelector);
        table.sortBy(2, false);

        return table;
    }

    function buildCachedVersionsTable(tableElement: HTMLTableElement) {
        function deleteCachedVersion(this: HTMLElement) {
            let row = this.parentElement.parentElement as HTMLTableRowElement;
            let cell = row.cells[0];
            let version = cell.textContent;

            connection.send('DeleteCachedVersion', version);
        }

        function cachedUpdate(this: HTMLElement) {
            let row = this.parentElement.parentElement as HTMLTableRowElement;
            let cell = row.cells[0];
            let version = cell.textContent;

            install(version);
            closeModal();
        }

        function buildDeleteCell(cell: HTMLTableCellElement, data: string) {
            let deleteButton = document.createElement('button');
            deleteButton.classList.add('button', 'is-danger');
            deleteButton.innerText = 'Delete';
            deleteButton.onclick = deleteCachedVersion;
            cell.appendChild(deleteButton);
        }

        function buildUpdateCell(cell: HTMLTableCellElement, data: string) {

            let UpdateButton = document.createElement('button');
            UpdateButton.classList.add('button', 'is-success');
            UpdateButton.innerText = 'Update';
            UpdateButton.onclick = cachedUpdate;
            cell.appendChild(UpdateButton);
        }

        let cellBuilders: Table.CellBuilder[] = [
            {
                CellBuilder: buildTextCell,
                SortKeySelector: sortDateCell,
            },
            {
                CellBuilder: buildDeleteCell
            },
            {
                CellBuilder: buildUpdateCell,
            }
        ];

        function keySelector(data: string) {
            return data;
        }

        let table = new Table.Table(tableElement, cellBuilders, undefined, keySelector);
        table.sortBy(0, false);

        return table;
    }

    function modPackSelected(this: HTMLInputElement, ev: MouseEvent) {
        if (this.checked) {
            let modPack = this.value;
            connection.invoke('SetSelectedModPack', modPack);
        }
    }

    fileUplaodButton.onclick = () => {
        fileUploadInput.click();
    }

    fileUploadInput.onchange = function (this: HTMLInputElement, ev: Event) {
        if (this.files.length == 0) {
            return;
        }

        let formData = new FormData();
        formData.set('serverId', serverSelect.value);

        let files = fileUploadInput.files
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }

        let xhr = new XMLHttpRequest();
        xhr.open('POST', '/admin/servers?handler=fileUpload', true);
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

        fileUploadInput.value = "";
    };

    fileDeleteButton.onclick = async () => {
        let checkboxes = document.querySelectorAll('input[name="fileCheckbox"]:checked');

        if (checkboxes.length == 0) {
            alert('Please select saves to delete.');
            return;
        }

        let files = [];

        for (let checkbox of checkboxes) {
            let dir = checkbox.getAttribute('data-directory');
            let name = checkbox.getAttribute('data-name');

            let filePath = `${dir}/${name}`;

            files.push(filePath);
        }

        let result: Result = await connection.invoke('DeleteFiles', files);

        if (!result.Success) {
            alert(JSON.stringify(result.Errors));
        }
    }

    fileMoveButton.onclick = async () => {
        let checkboxes = document.querySelectorAll('input[name="fileCheckbox"]:checked');

        if (checkboxes.length == 0) {
            alert('Please select saves to move.');
            return;
        }

        let files = [];

        for (let checkbox of checkboxes) {
            let dir = checkbox.getAttribute('data-directory');
            let name = checkbox.getAttribute('data-name');

            let filePath = `${dir}/${name}`;

            files.push(filePath);
        }

        let destination = destinationSelect.options[destinationSelect.selectedIndex].value;

        let result: Result = await connection.invoke('MoveFiles', destination, files);

        if (!result.Success) {
            alert(JSON.stringify(result.Errors));
        }
    }

    fileCopyButton.onclick = async () => {
        let checkboxes = document.querySelectorAll('input[name="fileCheckbox"]:checked');

        if (checkboxes.length == 0) {
            alert('Please select saves to copy.');
            return;
        }

        let files = [];

        for (let checkbox of checkboxes) {
            let dir = checkbox.getAttribute('data-directory');
            let name = checkbox.getAttribute('data-name');

            let filePath = `${dir}/${name}`;

            files.push(filePath);
        }

        let destination = destinationSelect.options[destinationSelect.selectedIndex].value;

        let result: Result = await connection.invoke('CopyFiles', destination, files);

        if (!result.Success) {
            alert(JSON.stringify(result.Errors));
        }
    }

    saveRenameButton.onclick = async () => {
        let checkboxes = document.querySelectorAll('input[name="fileCheckbox"]:checked');

        if (checkboxes.length != 1) {
            alert('Please select one file to rename.');
            return;
        }

        let newName = fileRenameInput.value.trim();
        if (newName === "") {
            alert('New name cannot be empty');
            return;
        }

        let checkbox = checkboxes[0];
        let dir = checkbox.getAttribute('data-directory');
        let name = checkbox.getAttribute('data-name');

        let result: Result = await connection.invoke('RenameFile', dir, name, newName);

        if (!result.Success) {
            alert(JSON.stringify(result.Errors));
        }
    }

    saveDeflateButton.onclick = async () => {
        let checkboxes = document.querySelectorAll('input[name="fileCheckbox"]:checked');

        if (checkboxes.length != 1) {
            alert('Please select one file to deflate.');
            return;
        }

        let newName = fileRenameInput.value.trim();

        let checkbox = checkboxes[0];
        let dir = checkbox.getAttribute('data-directory');
        let name = checkbox.getAttribute('data-name');

        let result: Result = await connection.invoke('DeflateSave', dir, name, newName);
        if (!result.Success) {
            alert(JSON.stringify(result.Errors));
            return;
        }

        deflateProgress.hidden = false;
    }

    connection.on('DeflateFinished', (result: Result) => {
        deflateProgress.hidden = true;

        if (!result.Success) {
            alert(JSON.stringify(result.Errors));
        }
    });

    let settingsSaved = true;
    function markSettingsSaved() {
        if (settingsSaved) {
            return;
        }

        settingsSaved = true;

        settingsBox.classList.remove('box-danger');
        settingsUnsavedLabel.classList.add('is-hidden');
        configSaveButton.setAttribute('disabled', '');
        undoSettingsButton.setAttribute('disabled', '');
    }

    function markSettingsUnsaved() {
        if (!settingsSaved) {
            return;
        }

        settingsSaved = false;

        settingsBox.classList.add('box-danger');
        settingsUnsavedLabel.classList.remove('is-hidden');
        configSaveButton.removeAttribute('disabled');
        undoSettingsButton.removeAttribute('disabled');
    }

    let extraSettingsSaved = true;
    function markExtraSettingsSaved() {
        if (extraSettingsSaved) {
            return;
        }

        extraSettingsSaved = true;

        extraSettingsBox.classList.remove('box-danger');
        extraSettingsUnsavedLabel.classList.add('is-hidden');
        configExtraSaveButton.setAttribute('disabled', '');
        undoExtraSettingsButton.setAttribute('disabled', '');
    }

    function markExtraSettingsUnsaved() {
        if (!extraSettingsSaved) {
            return;
        }

        extraSettingsSaved = false;

        extraSettingsBox.classList.add('box-danger');
        extraSettingsUnsavedLabel.classList.remove('is-hidden');
        configExtraSaveButton.removeAttribute('disabled');
        undoExtraSettingsButton.removeAttribute('disabled');
    }

    function processSettingsAndApplyToForm(settings: FactorioServerSettings) {
        settings.Name = settings.Name || "";
        configNameInput.value = settings.Name;

        settings.Description = settings.Description || "";
        configDescriptionInput.value = settings.Description;

        settings.Tags = settings.Tags || [];
        let text = '';
        for (let item of settings.Tags) {
            text += (item + '\n');
        }
        configTagsInput.value = text;

        settings.MaxPlayers = settings.MaxPlayers || 0;
        configMaxPlayersInput.value = settings.MaxPlayers + "";

        settings.GamePassword = settings.GamePassword || "";
        configPasswordInput.value = settings.GamePassword;

        settings.MaxUploadSlots = settings.MaxUploadSlots || 0;
        configMaxUploadSlots.value = settings.MaxUploadSlots + "";

        if (settings.AutoPause === undefined)
            settings.AutoPause = true;
        configPauseInput.checked = settings.AutoPause;

        if (settings.UseDefaultAdmins === undefined) {
            settings.UseDefaultAdmins = false;
        }
        configAdminUseDefault.checked = settings.UseDefaultAdmins;

        settings.Admins = settings.Admins || [];
        settings.Admins = settings.Admins.map(s => s.trim());
        configAdminInput.value = settings.Admins.join(', ');

        settings.AutosaveInterval = settings.AutosaveInterval || 0;
        configAutoSaveIntervalInput.value = settings.AutosaveInterval + "";

        settings.AutosaveSlots = settings.AutosaveSlots || 0;
        configAutoSaveSlotsInput.value = settings.AutosaveSlots + "";

        if (settings.NonBlockingSaving === undefined) {
            settings.NonBlockingSaving = true;
        }
        configNonBlockingSavingInput.checked = settings.NonBlockingSaving;

        if (settings.PublicVisible === undefined) {
            settings.PublicVisible = true;
        }
        configPublicVisibleInput.checked = settings.PublicVisible;

        configAdminInput.disabled = settings.UseDefaultAdmins;
    }

    function processExtraSettingsAndApplyToForm(settings: FactorioServerExtraSettings) {
        if (settings.SyncBans === undefined)
            settings.SyncBans = true;
        configSyncBans.checked = settings.SyncBans;

        if (settings.BuildBansFromDatabaseOnStart === undefined)
            settings.BuildBansFromDatabaseOnStart = true;
        configBuildBansFromDb.checked = settings.BuildBansFromDatabaseOnStart;

        if (settings.SetDiscordChannelName === undefined)
            settings.SetDiscordChannelName = true;
        configSetDiscordChannelName.checked = settings.SetDiscordChannelName;

        if (settings.GameChatToDiscord === undefined)
            settings.GameChatToDiscord = true;
        configSetGameChatToDiscord.checked = settings.GameChatToDiscord;

        if (settings.GameShoutToDiscord === undefined)
            settings.GameShoutToDiscord = true;
        configSetGameShoutToDiscord.checked = settings.GameShoutToDiscord;

        if (settings.DiscordToGameChat === undefined)
            settings.DiscordToGameChat = true;
        configSetDiscordToGameChat.checked = settings.DiscordToGameChat;
    }

    function buildSettings(): FactorioServerSettings {
        let text = configTagsInput.value;
        let tags = text.trim().split('\n');

        let max_players = parseInt(configMaxPlayersInput.value);
        if (isNaN(max_players)) {
            max_players = 0;
        }

        let interval = parseInt(configAutoSaveIntervalInput.value);
        if (isNaN(interval)) {
            interval = 5;
        }

        let slots = parseInt(configAutoSaveSlotsInput.value);
        if (isNaN(slots)) {
            slots = 20;
        }

        let maxUploadSlots = parseInt(configMaxUploadSlots.value);
        if (isNaN(maxUploadSlots)) {
            maxUploadSlots = 32;
        }

        let settings: FactorioServerSettings = {
            Name: configNameInput.value,
            Description: configDescriptionInput.value,
            Tags: tags,
            MaxPlayers: max_players,
            GamePassword: configPasswordInput.value,
            MaxUploadSlots: maxUploadSlots,
            AutoPause: configPauseInput.checked,
            UseDefaultAdmins: configAdminUseDefault.checked,
            Admins: configAdminInput.value.split(','),
            AutosaveInterval: interval,
            AutosaveSlots: slots,
            NonBlockingSaving: configNonBlockingSavingInput.checked,
            PublicVisible: configPublicVisibleInput.checked
        };

        return settings;
    }

    configNameInput.onchange = () => {
        markSettingsUnsaved();

        let data: KeyValueCollectionChangedData = {
            Type: CollectionChangeType.Add,
            NewItems: { Name: configNameInput.value }
        };
        connection.send('UpdateServerSettings', data);
    }

    configDescriptionInput.onchange = () => {
        markSettingsUnsaved();

        let data: KeyValueCollectionChangedData = {
            Type: CollectionChangeType.Add,
            NewItems: { Description: configDescriptionInput.value }
        };
        connection.send('UpdateServerSettings', data);
    }

    configTagsInput.onchange = () => {
        markSettingsUnsaved();

        let tags = configTagsInput.value.trim().split('\n');

        let data: KeyValueCollectionChangedData = {
            Type: CollectionChangeType.Add,
            NewItems: { Tags: tags }
        };
        connection.send('UpdateServerSettings', data);
    }

    configMaxPlayersInput.onchange = () => {
        markSettingsUnsaved();

        let max_players = parseInt(configMaxPlayersInput.value);
        if (isNaN(max_players)) {
            max_players = 0;
        }

        let data: KeyValueCollectionChangedData = {
            Type: CollectionChangeType.Add,
            NewItems: { MaxPlayers: max_players }
        };
        connection.send('UpdateServerSettings', data);
    }

    configPasswordInput.onchange = () => {
        markSettingsUnsaved();

        let data: KeyValueCollectionChangedData = {
            Type: CollectionChangeType.Add,
            NewItems: { GamePassword: configPasswordInput.value }
        };
        connection.send('UpdateServerSettings', data);
    }

    configMaxUploadSlots.onchange = () => {
        markSettingsUnsaved();

        let maxUploadSlots = parseInt(configMaxUploadSlots.value);
        if (isNaN(maxUploadSlots)) {
            maxUploadSlots = 32;
        }

        let data: KeyValueCollectionChangedData = {
            Type: CollectionChangeType.Add,
            NewItems: { MaxUploadSlots: maxUploadSlots }
        };
        connection.send('UpdateServerSettings', data);
    }

    configPauseInput.onchange = () => {
        markSettingsUnsaved();

        let data: KeyValueCollectionChangedData = {
            Type: CollectionChangeType.Add,
            NewItems: { AutoPause: configPauseInput.checked }
        };
        connection.send('UpdateServerSettings', data);
    }

    configAdminUseDefault.onchange = () => {
        markSettingsUnsaved();

        configAdminInput.disabled = configAdminUseDefault.checked;

        let data: KeyValueCollectionChangedData = {
            Type: CollectionChangeType.Add,
            NewItems: { UseDefaultAdmins: configAdminUseDefault.checked }
        };
        connection.send('UpdateServerSettings', data);
    }

    configAdminInput.onchange = () => {
        markSettingsUnsaved();

        let data: KeyValueCollectionChangedData = {
            Type: CollectionChangeType.Add,
            NewItems: { Admins: configAdminInput.value.split(',') }
        };
        connection.send('UpdateServerSettings', data);
    }

    configAutoSaveIntervalInput.onchange = () => {
        markSettingsUnsaved();

        let interval = parseInt(configAutoSaveIntervalInput.value);
        if (isNaN(interval)) {
            interval = 5;
        }

        let data: KeyValueCollectionChangedData = {
            Type: CollectionChangeType.Add,
            NewItems: { AutosaveInterval: interval }
        };
        connection.send('UpdateServerSettings', data);
    }

    configAutoSaveSlotsInput.onchange = () => {
        markSettingsUnsaved();

        let slots = parseInt(configAutoSaveSlotsInput.value);
        if (isNaN(slots)) {
            slots = 20;
        }

        let data: KeyValueCollectionChangedData = {
            Type: CollectionChangeType.Add,
            NewItems: { AutosaveSlots: slots }
        };
        connection.send('UpdateServerSettings', data);
    }

    configNonBlockingSavingInput.onchange = () => {
        markSettingsUnsaved();

        let data: KeyValueCollectionChangedData = {
            Type: CollectionChangeType.Add,
            NewItems: { NonBlockingSaving: configNonBlockingSavingInput.checked }
        };
        connection.send('UpdateServerSettings', data);
    }

    configPublicVisibleInput.onchange = () => {
        markSettingsUnsaved();

        let data: KeyValueCollectionChangedData = {
            Type: CollectionChangeType.Add,
            NewItems: { PublicVisible: configPublicVisibleInput.checked }
        };
        connection.send('UpdateServerSettings', data);
    }

    configSaveButton.onclick = async () => {
        let settings = buildSettings();

        let result: Result = await connection.invoke('SaveServerSettings', settings);

        if (!result.Success) {
            alert(JSON.stringify(result.Errors));
        }
    };

    undoSettingsButton.onclick = () => {
        connection.send('UndoServerSettings');
    };

    function buildExtraSettings(): FactorioServerExtraSettings {
        let settings: FactorioServerExtraSettings = {
            SyncBans: configSyncBans.checked,
            BuildBansFromDatabaseOnStart: configBuildBansFromDb.checked,
            SetDiscordChannelName: configSetDiscordChannelName.checked,
            GameChatToDiscord: configSetGameChatToDiscord.checked,
            GameShoutToDiscord: configSetGameShoutToDiscord.checked,
            DiscordToGameChat: configSetDiscordToGameChat.checked,
        }

        return settings;
    }

    configSyncBans.onchange = () => {
        markExtraSettingsUnsaved();

        let data: KeyValueCollectionChangedData = {
            Type: CollectionChangeType.Add,
            NewItems: { SyncBans: configSyncBans.checked }
        };
        connection.send('UpdateServerExtraSettings', data);
    }

    configBuildBansFromDb.onchange = () => {
        markExtraSettingsUnsaved();

        let data: KeyValueCollectionChangedData = {
            Type: CollectionChangeType.Add,
            NewItems: { BuildBansFromDatabaseOnStart: configBuildBansFromDb.checked }
        };
        connection.send('UpdateServerExtraSettings', data);
    }

    configSetDiscordChannelName.onchange = () => {
        markExtraSettingsUnsaved();

        let data: KeyValueCollectionChangedData = {
            Type: CollectionChangeType.Add,
            NewItems: { SetDiscordChannelName: configSetDiscordChannelName.checked }
        };
        connection.send('UpdateServerExtraSettings', data);
    }

    configSetGameChatToDiscord.onchange = () => {
        markExtraSettingsUnsaved();

        let data: KeyValueCollectionChangedData = {
            Type: CollectionChangeType.Add,
            NewItems: { GameChatToDiscord: configSetGameChatToDiscord.checked }
        };
        connection.send('UpdateServerExtraSettings', data);
    }

    configSetGameShoutToDiscord.onchange = () => {
        markExtraSettingsUnsaved();

        let data: KeyValueCollectionChangedData = {
            Type: CollectionChangeType.Add,
            NewItems: { GameShoutToDiscord: configSetGameShoutToDiscord.checked }
        };
        connection.send('UpdateServerExtraSettings', data);
    }

    configSetDiscordToGameChat.onchange = () => {
        markExtraSettingsUnsaved();

        let data: KeyValueCollectionChangedData = {
            Type: CollectionChangeType.Add,
            NewItems: { DiscordToGameChat: configSetDiscordToGameChat.checked }
        };
        connection.send('UpdateServerExtraSettings', data);
    }

    configExtraSaveButton.onclick = async () => {
        let settings = buildExtraSettings();

        let result: Result = await connection.invoke('SaveServerExtraSettings', settings);

        if (!result.Success) {
            alert(JSON.stringify(result.Errors));
        }
    };

    undoExtraSettingsButton.onclick = () => {
        connection.send('UndoServerExtraSettings');
    };

    copySettingsButton.onclick = () => {
        let settings = buildSettings();
        let text = JSON.stringify(settings);

        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';

        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
    }

    pasteSettingsTextInput.onmousedown = () => {
        pasteSettingsTextInput.value = "";
    }

    pasteSettingsTextInput.onpaste = (event: ClipboardEvent) => {
        event.preventDefault();

        let text = event.clipboardData.getData('text/plain');
        let settings;

        try {
            settings = JSON.parse(text);
        }
        catch (ex) {
            pasteSettingsTextInput.value = 'Invalid settings';
            return;
        }

        if (Utils.isObject(settings)) {
            markSettingsUnsaved();

            processSettingsAndApplyToForm(settings);
            pasteSettingsTextInput.value = 'Settings applied';

            let data: KeyValueCollectionChangedData = {
                Type: CollectionChangeType.Add,
                NewItems: settings
            };
            connection.send('UpdateServerSettings', data);

        } else {
            pasteSettingsTextInput.value = 'Invalid settings';
        }
    }

    copyExtraSettingsButton.onclick = () => {
        let settings = buildExtraSettings();
        let text = JSON.stringify(settings);

        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';

        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
    }

    pasteExtraSettingsTextInput.onmousedown = () => {
        pasteExtraSettingsTextInput.value = "";
    }

    pasteExtraSettingsTextInput.onpaste = (event: ClipboardEvent) => {
        event.preventDefault();

        let text = event.clipboardData.getData('text/plain');
        let settings;

        try {
            settings = JSON.parse(text);
        }
        catch (ex) {
            pasteExtraSettingsTextInput.value = 'Invalid settings';
            return;
        }

        if (Utils.isObject(settings)) {
            markExtraSettingsUnsaved();

            processExtraSettingsAndApplyToForm(settings);
            pasteExtraSettingsTextInput.value = 'Settings applied';

            let data: KeyValueCollectionChangedData = {
                Type: CollectionChangeType.Add,
                NewItems: settings
            };
            connection.send('UpdateServerExtraSettings', data);
        } else {
            pasteExtraSettingsTextInput.value = 'Invalid settings';
        }
    }

    function ensureModPackSelected() {
        let radios = modPackTableElement.querySelectorAll('input[type="radio"]');

        for (let element of radios) {
            let radio = element as HTMLInputElement;
            if (radio.value === selectedModPack) {
                radio.checked = true;
                return;
            }
        }

        let noMods = modPackTableElement.querySelectorAll('input[type="radio"][value=""]')[0] as HTMLInputElement;

        if (noMods) {
            noMods.checked = true;
        }
    }

    connection.on("SendMessage", writeMessage)

    connection.on('FactorioStatusChanged', (newStatus: string, oldStatus: string) => {
        statusText.innerText = newStatus;
    });

    connection.on('SendVersion', (version: string) => {
        versionText.textContent = version;
    });

    connection.on('SendDownloadableVersions', (versions: string[]) => {
        updateSelect.innerHTML = "";

        for (let version of versions) {
            let option = document.createElement('option');
            option.innerText = version;
            updateSelect.appendChild(option);
        }

        let option = document.createElement('option');
        option.innerText = 'latest';
        updateSelect.appendChild(option);

        updateSelect.parentElement.classList.remove('is-loading');
    });

    connection.on('SendTempSavesFiles', (serverId: string, data: CollectionChangedData) => {
        if (serverId !== serverSelect.value) {
            return;
        }

        tempSaveFilesTable.update(data);
    });

    connection.on('SendLocalSaveFiles', (serverId: string, data: CollectionChangedData) => {
        if (serverId !== serverSelect.value) {
            return;
        }

        localSaveFilesTable.update(data);
    });

    connection.on('SendGlobalSaveFiles', (data: CollectionChangedData) => {
        globalSaveFilesTable.update(data);
    });

    connection.on('SendScenarios', (data: CollectionChangedData) => {
        scenarioTable.update(data);
    });

    connection.on('SendModPacks', (data: CollectionChangedData) => {
        if (data.Type === CollectionChangeType.Reset) {
            let noMods: ModPackMetaData = { Name: "", CreatedTime: "", LastModifiedTime: "" };
            data.NewItems.push(noMods);
        }

        modPackTable.update(data);

        ensureModPackSelected();
    });

    connection.on('SendLogFiles', (serverId: string, data: CollectionChangedData) => {
        if (serverId !== serverSelect.value) {
            return;
        }

        logsFileTable.update(data);
    });

    connection.on('SendChatLogFiles', (serverId: string, data: CollectionChangedData) => {
        if (serverId !== serverSelect.value) {
            return;
        }

        chatLogsFileTable.update(data);
    });

    connection.on('SendSelectedModPack', function (modPack: string) {
        selectedModPack = modPack;
        ensureModPackSelected();
    });

    connection.on('SendCachedVersions', (data: CollectionChangedData<string>) => {
        cachedVersionsTable.update(data);
    });

    connection.on('SendServerSettings', (settings: FactorioServerSettings, saved: boolean) => {
        processSettingsAndApplyToForm(settings);
        serverName.innerText = settings.Name;

        if (saved) {
            markSettingsSaved();
        } else {
            markSettingsUnsaved();
        }
    });

    connection.on('SendServerExtraSettings', (settings: FactorioServerExtraSettings, saved: boolean) => {
        processExtraSettingsAndApplyToForm(settings);

        markExtraSettingsSaved();

        if (saved) {
            markExtraSettingsSaved();
        } else {
            markExtraSettingsUnsaved();
        }
    });

    connection.on('SendServerSettingsUpdate', (data: KeyValueCollectionChangedData, markUnsaved: boolean) => {
        if (data.Type != CollectionChangeType.Add) {
            return;
        }

        if (markUnsaved) {
            markSettingsUnsaved();
        }

        let settings = data.NewItems as FactorioServerSettings;

        for (let key in settings) {
            let k = key as FactorioServerSettingsType;
            let value = settings[key];

            switch (k) {
                case "Name":
                    value = value || "";
                    configNameInput.value = value;
                    break;
                case "Description":
                    value = value || "";
                    configDescriptionInput.value = value;
                    break;
                case "Tags":
                    value = value || [];
                    let text = '';
                    for (let item of value) {
                        text += (item + '\n');
                    }
                    configTagsInput.value = text;
                    break;
                case "MaxPlayers":
                    value = value || 0;
                    configMaxPlayersInput.value = value;
                    break;
                case "GamePassword":
                    value = value || "";
                    configPasswordInput.value = value;
                    break;
                case "MaxUploadSlots":
                    value = value || 0;
                    configMaxUploadSlots.value = value;
                    break;
                case "AutoPause":
                    if (value === undefined)
                        value = true;
                    configPauseInput.checked = value;
                    break;
                case "UseDefaultAdmins":
                    if (value === undefined)
                        value = true;
                    configAdminUseDefault.checked = value;
                    configAdminInput.disabled = value;
                    break;
                case "Admins":
                    value = value || [];
                    configAdminInput.value = value.join(', ');
                    break;
                case "AutosaveInterval":
                    value = value || 0;
                    configAutoSaveIntervalInput.value = value;
                    break;
                case "AutosaveSlots":
                    value = value || 0;
                    configAutoSaveSlotsInput.value = value;
                    break;
                case "NonBlockingSaving":
                    if (value === undefined)
                        value = true;
                    configNonBlockingSavingInput.checked = value;
                    break;
                case "PublicVisible":
                    if (value === undefined)
                        value = true;
                    configPublicVisibleInput.checked = value;
                    break;
                default:
                    break;
            }
        }
    });

    connection.on('SendServerExtraSettingsUpdate', (data: KeyValueCollectionChangedData, markUnsaved: boolean) => {
        if (data.Type != CollectionChangeType.Add) {
            return;
        }

        if (markUnsaved) {
            markExtraSettingsUnsaved();
        }

        let settings = data.NewItems as FactorioServerSettings;

        for (let key in settings) {
            let k = key as FactorioServerExtraSettingsType;
            let value = settings[key];

            switch (k) {
                case "SyncBans":
                    if (value === undefined)
                        value = true;
                    configSyncBans.checked = value;
                    break;
                case "BuildBansFromDatabaseOnStart":
                    if (value === undefined)
                        value = true;
                    configBuildBansFromDb.checked = value;
                    break;
                case "SetDiscordChannelName":
                    if (value === undefined)
                        value = true;
                    configSetDiscordChannelName.checked = value;
                    break;
                case "GameChatToDiscord":
                    if (value === undefined)
                        value = true;
                    configSetGameChatToDiscord.checked = value;
                    break;
                case "GameShoutToDiscord":
                    if (value === undefined)
                        value = true;
                    configSetGameShoutToDiscord.checked = value;
                    break;
                case "DiscordToGameChat":
                    if (value === undefined)
                        value = true;
                    configSetDiscordToGameChat.checked = value;
                    break;
                default:
                    break;
            }
        }
    });

    function onPageLoad() {
        tempSaveFilesTable = buildFileTable(tempSaveFilesTableElement);
        localSaveFilesTable = buildFileTable(localSaveFilesTableElement);
        globalSaveFilesTable = buildFileTable(globalSaveFilesTableElement);
        scenarioTable = buildScenarioTable(scenarioTableElement);
        logsFileTable = buildLogFileTable(logsFileTableElement, 'logFile');
        chatLogsFileTable = buildLogFileTable(chatLogsFileTableElement, 'chatLogFile');
        modPackTable = buildModPackTable(modPackTableElement);
        cachedVersionsTable = buildCachedVersionsTable(cachedVersionsTableElement);

        let value = serverSelect.value;
        history.replaceState({ value: value }, '', `/admin/servers/${value}`);

        startConnection();
    }

    onPageLoad();
}();

