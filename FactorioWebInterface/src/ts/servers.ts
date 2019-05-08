import * as signalR from "@aspnet/signalr";
import { MessagePackHubProtocol } from "@aspnet/signalr-protocol-msgpack"
import * as $ from "jquery";

!function () {

    enum MessageType {
        Output = "Output",
        Wrapper = "Wrapper",
        Control = "Control",
        Status = "Status",
        Discord = "Discord",
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

    interface Error {
        Key: string;
        Description: string;
    }

    interface Result {
        Success: boolean;
        Errors: Error[];
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

    interface FactorioServerExtraSettings {
        SyncBans: boolean;
        BuildBansFromDatabaseOnStart: boolean;
        SetDiscordChannelName: boolean;
        GameChatToDiscord: boolean;
        GameShoutToDiscord: boolean;
        DiscordToGameChat: boolean;
    }

    const maxMessageCount = 200;

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

    const tempSaveFilesTable: HTMLTableElement = document.getElementById('tempSaveFilesTable') as HTMLTableElement;
    const localSaveFilesTable: HTMLTableElement = document.getElementById('localSaveFilesTable') as HTMLTableElement;
    const globalSaveFilesTable: HTMLTableElement = document.getElementById('globalSaveFilesTable') as HTMLTableElement;
    const scenarioTable: HTMLTableElement = document.getElementById('scenarioTable') as HTMLTableElement;
    const logsFileTable: HTMLTableElement = document.getElementById('logsFileTable') as HTMLTableElement;
    const chatLogsFileTable: HTMLTableElement = document.getElementById('chatLogsFileTable') as HTMLTableElement;

    const updateModal = document.getElementById('updateModal') as HTMLDivElement;
    const closeModalButton = document.getElementById('closeModalButton') as HTMLButtonElement;
    const modalBackground = document.getElementById('modalBackground') as HTMLDivElement;
    const updateSelect = document.getElementById('updateSelect') as HTMLSelectElement;
    const downloadAndUpdateButton = document.getElementById('downloadAndUpdateButton') as HTMLButtonElement;
    const cachedVersionsTableBody = document.getElementById('cachedVersionsTableBody') as HTMLBodyElement;

    const modPackTable: HTMLTableElement = document.getElementById('modPackTable') as HTMLTableElement;

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

    const configNameInput = document.getElementById('configNameInput') as HTMLInputElement;
    const configDescriptionInput = document.getElementById('configDescriptionInput') as HTMLInputElement;
    const configTagsInput = document.getElementById('configTagsInput') as HTMLTextAreaElement;
    const configMaxPlayersInput = document.getElementById('configMaxPlayersInput') as HTMLInputElement;
    const configPasswordInput = document.getElementById('configPasswordInput') as HTMLInputElement;
    const configMaxUploadSlots = document.getElementById('configMaxUploadSlots') as HTMLInputElement;
    const configPauseInput = document.getElementById('configPauseInput') as HTMLInputElement;
    const configAdminUseDefault = document.getElementById('configAdminUseDefault') as HTMLInputElement;
    const configAdminInput = document.getElementById('configAdminInput') as HTMLTextAreaElement;
    const configSaveButton = document.getElementById('configSaveButton') as HTMLButtonElement;
    const configAutoSaveIntervalInput = document.getElementById('configAutoSaveIntervalInput') as HTMLInputElement;
    const configAutoSaveSlotsInput = document.getElementById('configAutoSaveSlotsInput') as HTMLInputElement;
    const configNonBlockingSavingInput = document.getElementById('configNonBlockingSavingInput') as HTMLInputElement;
    const configPublicVisibleInput = document.getElementById('configPublicVisibleInput') as HTMLInputElement;
    const configSyncBans = document.getElementById('configSyncBans') as HTMLInputElement;
    const configBuildBansFromDb = document.getElementById('configBuildBansFromDb') as HTMLInputElement;
    const configSetDiscordChannelName = document.getElementById('configSetDiscordChannelName') as HTMLInputElement;
    const configExtraSaveButton = document.getElementById('configExtraSaveButton') as HTMLButtonElement;
    const configSetGameChatToDiscord = document.getElementById('configSetGameChatToDiscord') as HTMLInputElement;
    const configSetGameShoutToDiscord = document.getElementById('configSetGameShoutToDiscord') as HTMLInputElement;
    const configSetDiscordToGameChat = document.getElementById('configSetDiscordToGameChat') as HTMLInputElement;

    let messageCount = 0;
    let commandHistory: string[] = [];
    let commandHistoryIndex = 0;

    let selectedModPack = "";

    const connection = new signalR.HubConnectionBuilder()
        .withUrl("/factorioControlHub")
        .withHubProtocol(new MessagePackHubProtocol())
        .build();

    configAdminUseDefault.onchange = () => {
        configAdminInput.disabled = configAdminUseDefault.checked;
    }

    async function getFiles() {
        let tempFiles = await connection.invoke('GetTempSaveFiles') as FileMetaData[];
        updateFileTable(tempSaveFilesTable, tempFiles);

        let localFiles = await connection.invoke('GetLocalSaveFiles') as FileMetaData[];
        updateFileTable(localSaveFilesTable, localFiles);

        let globalFiles = await connection.invoke('GetGlobalSaveFiles') as FileMetaData[];
        updateFileTable(globalSaveFilesTable, globalFiles);
    }

    async function getScenarios() {
        let scenarios = await connection.invoke('GetScenarios') as ScenarioMetaData[];
        updateBuildScenarioTable(scenarioTable, scenarios);
    }

    async function getLogs() {
        let logs = await connection.invoke('GetLogFiles') as FileMetaData[];
        updateLogFileTable(logsFileTable, logs, 'logFile')
    }

    async function getChatLogs() {
        let logs = await connection.invoke('GetChatLogFiles') as FileMetaData[];
        updateLogFileTable(chatLogsFileTable, logs, 'chatLogFile')
    }

    async function getSettings() {
        let settings = await connection.invoke('GetServerSettings') as FactorioServerSettings;

        configNameInput.value = settings.Name;
        configDescriptionInput.value = settings.Description;

        let text = '';
        for (let item of settings.Tags) {
            text += (item + '\n');
        }
        configTagsInput.value = text;

        configMaxPlayersInput.value = settings.MaxPlayers + "";
        configPasswordInput.value = settings.GamePassword;
        configMaxUploadSlots.value = settings.MaxUploadSlots + "";
        configPauseInput.checked = settings.AutoPause;
        configAdminUseDefault.checked = settings.UseDefaultAdmins;
        configAdminInput.value = settings.Admins.join(', ');
        configAutoSaveIntervalInput.value = settings.AutosaveInterval + "";
        configAutoSaveSlotsInput.value = settings.AutosaveSlots + "";
        configNonBlockingSavingInput.checked = settings.NonBlockingSaving;
        configPublicVisibleInput.checked = settings.PublicVisible;

        configAdminInput.disabled = settings.UseDefaultAdmins;

        serverName.innerText = settings.Name;
    }

    async function getExtraSettings() {
        let settings = await connection.invoke('GetServerExtraSettings') as FactorioServerExtraSettings;

        configSyncBans.checked = settings.SyncBans;
        configBuildBansFromDb.checked = settings.BuildBansFromDatabaseOnStart;
        configSetDiscordChannelName.checked = settings.SetDiscordChannelName;
        configSetGameChatToDiscord.checked = settings.GameChatToDiscord;
        configSetGameShoutToDiscord.checked = settings.GameShoutToDiscord;
        configSetDiscordToGameChat.checked = settings.DiscordToGameChat;
    }

    async function getVersion() {
        versionText.textContent = await connection.invoke('GetVersion')
    }

    async function getModPacks() {
        let modPacks = await connection.invoke('GetModPacks') as ModPackMetaData[];
        let selectedModPack = await connection.invoke('GetModPack') as string;

        updateModPackTable(modPackTable, modPacks, selectedModPack);
    }

    function onPageLoad() {
        buildFileTable(tempSaveFilesTable);
        buildFileTable(localSaveFilesTable);
        buildFileTable(globalSaveFilesTable);
        buildScenarioTable(scenarioTable);
        buildLogFileTable(logsFileTable);
        buildLogFileTable(chatLogsFileTable);
        buildModPackTable(modPackTable);

        let value = serverSelect.value;
        history.replaceState({ value: value }, '', `/admin/servers/${value}`);
    }

    onPageLoad();

    async function updatePage() {
        let data = await connection.invoke('SetServerId', serverSelect.value) as FactorioContorlClientData;

        messageCount = 0;
        divMessages.innerHTML = "";

        getFiles();
        getScenarios();
        getModPacks();
        getLogs();
        getChatLogs();
        getSettings();
        getExtraSettings();
        getVersion();

        statusText.innerText = data.Status;

        for (let message of data.Messages) {
            writeMessage(message);
        }
    }

    async function start() {
        try {
            await connection.start();

            await updatePage();
        } catch (ex) {
            console.log(ex.message);
            setTimeout(() => start(), 2000);
        }
    }

    connection.onclose(async () => {
        await start();
    });

    serverSelect.onchange = function (this: HTMLSelectElement) {
        let value = this.value;
        history.pushState({ value: value }, '', `/admin/servers/${value}`);
        updatePage();
    };

    onpopstate = function (e) {
        let state = e.state;
        console.log(state);
        if (state) {
            serverSelect.value = state.value;
            updatePage();
        }
    };

    connection.on("SendMessage", writeMessage)

    connection.on('FactorioStatusChanged', (newStatus: string, oldStatus: string) => {
        console.log(`new: ${newStatus}, old: ${oldStatus}`);
        statusText.innerText = newStatus;
    });

    connection.on('SendVersion', (version: string) => {
        versionText.textContent = version;
    });

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
        connection.send('RequestGetDownloadableVersions');
        connection.send('RequestGetCachedVersions');

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

    function cachedUpdate(this: HTMLElement) {
        let row = this.parentElement.parentElement as HTMLTableRowElement;
        let cell = row.cells[0];
        let version = cell.textContent;

        install(version);
        closeModal();
    }

    function deleteCachedVersion(this: HTMLElement) {
        let row = this.parentElement.parentElement as HTMLTableRowElement;
        let cell = row.cells[0];
        let version = cell.textContent;

        connection.send('DeleteCachedVersion', version);
    }

    connection.on('SendCachedVersions', (versions: string[]) => {
        cachedVersionsTableBody.innerHTML = "";

        for (let version of versions) {
            let row = document.createElement('tr');

            let cell1 = document.createElement('td');
            cell1.innerText = version;
            row.appendChild(cell1);

            let cell2 = document.createElement('td');
            let deleteButton = document.createElement('button');
            deleteButton.classList.add('button', 'is-danger');
            deleteButton.innerText = 'Delete';
            deleteButton.onclick = deleteCachedVersion;
            cell2.appendChild(deleteButton);
            row.appendChild(cell2);

            let cell3 = document.createElement('td');
            let UpdateButton = document.createElement('button');
            UpdateButton.classList.add('button', 'is-success');
            UpdateButton.innerText = 'Update';
            UpdateButton.onclick = cachedUpdate;
            cell3.appendChild(UpdateButton);
            row.appendChild(cell3);

            cachedVersionsTableBody.appendChild(row);
        }
    });

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
                data = `${message.Message}`;
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

    function buildFileTable(table: HTMLTableElement) {
        let cells = table.tHead.rows[0].cells;

        let input = cells[0].firstChild as HTMLInputElement;
        input.onchange = () => toggleSelectTable(input, table);

        cells[0].onclick = () => sortTable(table, 'select');
        cells[1].onclick = () => sortTable(table, 'name');
        cells[2].onclick = () => sortTable(table, 'createdTime');
        cells[3].onclick = () => sortTable(table, 'lastModifiedTime');
        cells[4].onclick = () => sortTable(table, 'size');

        let jTable = $(table);

        jTable.data('select', r => {
            let value = r.children[0].firstChild as HTMLInputElement;
            return value.checked ? 1 : 0;
        });

        jTable.data('name', r => r.children[1].firstChild.textContent.toLowerCase());
        jTable.data('createdTime', r => r.children[2].textContent);
        jTable.data('lastModifiedTime', r => r.children[3].textContent);
        jTable.data('size', r => parseInt(r.children[4].getAttribute('data-size')));

        jTable.data('sortProperty', 'lastModifiedTime');
        jTable.data('ascending', false);
    }

    function updateFileTable(table: HTMLTableElement, files: FileMetaData[]) {
        let body = table.tBodies[0];

        body.innerHTML = "";

        for (let file of files) {
            let row = document.createElement('tr');

            let cell = document.createElement('td');
            let checkbox = document.createElement('input') as HTMLInputElement;
            checkbox.type = 'checkbox';
            checkbox.name = 'fileCheckbox';
            checkbox.setAttribute('data-directory', file.Directory);
            checkbox.setAttribute('data-name', file.Name);
            cell.appendChild(checkbox);
            row.appendChild(cell);

            let cell2 = document.createElement('td');
            let link = document.createElement('a') as HTMLAnchorElement;
            link.innerText = file.Name;
            link.href = `/admin/servers?handler=file&directory=${file.Directory}&name=${file.Name}`;
            cell2.appendChild(link);
            row.appendChild(cell2);

            let cell3 = document.createElement('td');
            cell3.innerText = formatDate(file.CreatedTime);
            row.appendChild(cell3);

            let cell4 = document.createElement('td');
            cell4.innerText = formatDate(file.LastModifiedTime);
            row.appendChild(cell4);

            let cell5 = document.createElement('td');
            cell5.innerText = bytesToSize(file.Size);
            cell5.setAttribute('data-size', file.Size.toString());
            row.appendChild(cell5);

            body.appendChild(row);
        }

        let jTable = $(table);

        let rows: HTMLTableRowElement[] = []
        let rc = body.rows;
        for (let i = 0; i < rc.length; i++) {
            let r = rc[i];
            rows.push(r);
        }

        jTable.data('rows', rows);

        let ascending = !jTable.data('ascending');
        jTable.data('ascending', ascending);
        let property = jTable.data('sortProperty');

        sortTable(table, property);
    }

    function buildLogFileTable(table: HTMLTableElement) {
        let cells = table.tHead.rows[0].cells;

        cells[0].onclick = () => sortTable(table, 'name');
        cells[1].onclick = () => sortTable(table, 'createdTime');
        cells[2].onclick = () => sortTable(table, 'lastModifiedTime');
        cells[3].onclick = () => sortTable(table, 'size');

        let jTable = $(table);

        jTable.data('name', r => r.children[0].firstChild.textContent.toLowerCase());
        jTable.data('createdTime', r => r.children[1].textContent);
        jTable.data('lastModifiedTime', r => r.children[2].textContent);
        jTable.data('size', r => parseInt(r.children[3].getAttribute('data-size')));

        jTable.data('sortProperty', 'lastModifiedTime');
        jTable.data('ascending', false);
    }

    function updateLogFileTable(table: HTMLTableElement, files: FileMetaData[], handler: string) {
        let body = table.tBodies[0];

        body.innerHTML = "";

        for (let file of files) {
            let row = document.createElement('tr');

            let cell2 = document.createElement('td');
            let link = document.createElement('a') as HTMLAnchorElement;
            link.innerText = file.Name;
            link.href = `/admin/servers?handler=${handler}&directory=${file.Directory}&name=${file.Name}`;
            cell2.appendChild(link);
            row.appendChild(cell2);

            let cell3 = document.createElement('td');
            cell3.innerText = formatDate(file.CreatedTime);
            row.appendChild(cell3);

            let cell4 = document.createElement('td');
            cell4.innerText = formatDate(file.LastModifiedTime);
            row.appendChild(cell4);

            let cell5 = document.createElement('td');
            cell5.innerText = bytesToSize(file.Size);
            cell5.setAttribute('data-size', file.Size.toString());
            row.appendChild(cell5);

            body.appendChild(row);
        }

        let jTable = $(table);

        let rows: HTMLTableRowElement[] = []
        let rc = body.rows;
        for (let i = 0; i < rc.length; i++) {
            let r = rc[i];
            rows.push(r);
        }
        jTable.data('rows', rows);

        let ascending = !jTable.data('ascending');
        jTable.data('ascending', ascending);
        let property = jTable.data('sortProperty');

        sortTable(table, property);
    }

    function buildScenarioTable(table: HTMLTableElement) {
        let cells = table.tHead.rows[0].cells;

        let input = cells[0].firstChild as HTMLInputElement;
        input.onchange = () => toggleSelectTable(input, table);

        cells[0].onclick = () => sortTable(table, 'select');
        cells[1].onclick = () => sortTable(table, 'name');
        cells[2].onclick = () => sortTable(table, 'createdTime');
        cells[3].onclick = () => sortTable(table, 'lastModifiedTime');

        let jTable = $(table);

        jTable.data('select', r => {
            let value = r.children[0].firstChild as HTMLInputElement;
            return value.checked ? 1 : 0;
        });

        jTable.data('name', r => r.children[1].firstChild.textContent.toLowerCase());
        jTable.data('createdTime', r => r.children[2].textContent);
        jTable.data('lastModifiedTime', r => r.children[3].textContent);

        jTable.data('sortProperty', 'lastModifiedTime');
        jTable.data('ascending', false);
    }

    function updateBuildScenarioTable(table: HTMLTableElement, scenarios: ScenarioMetaData[]) {
        let body = table.tBodies[0];

        body.innerHTML = "";

        for (let scenario of scenarios) {
            let row = document.createElement('tr');

            let cell = document.createElement('td');
            let checkbox = document.createElement('input') as HTMLInputElement;
            checkbox.type = 'checkbox';
            checkbox.name = 'scenarioCheckbox';
            checkbox.setAttribute('data-name', scenario.Name);
            cell.appendChild(checkbox);
            row.appendChild(cell);

            createCell(row, scenario.Name);

            let cell3 = document.createElement('td');
            cell3.innerText = formatDate(scenario.CreatedTime);
            row.appendChild(cell3);

            let cell4 = document.createElement('td');
            cell4.innerText = formatDate(scenario.LastModifiedTime);
            row.appendChild(cell4);

            body.appendChild(row);
        }

        let jTable = $(table);

        let rows: HTMLTableRowElement[] = []
        let rc = body.rows;
        for (let i = 0; i < rc.length; i++) {
            let r = rc[i];
            rows.push(r);
        }
        jTable.data('rows', rows);

        let ascending = !jTable.data('ascending');
        jTable.data('ascending', ascending);
        let property = jTable.data('sortProperty');

        sortTable(table, property);
    }

    function buildModPackTable(table: HTMLTableElement) {
        let cells = table.tHead.rows[0].cells;

        let input = cells[0].firstChild as HTMLInputElement;
        input.onchange = () => toggleSelectTable(input, table);

        cells[0].onclick = () => sortTable(table, 'select');
        cells[1].onclick = () => sortTable(table, 'name');
        cells[2].onclick = () => sortTable(table, 'lastModifiedTime');

        let jTable = $(table);

        jTable.data('select', r => {
            let value = r.children[0].firstChild as HTMLInputElement;
            return value.checked ? 1 : 0;
        });

        jTable.data('name', r => r.children[1].firstChild.textContent.toLowerCase());
        jTable.data('lastModifiedTime', r => r.children[2].textContent);

        jTable.data('sortProperty', 'lastModifiedTime');
        jTable.data('ascending', false);
    }

    function updateModPackTable(table: HTMLTableElement, modPacks: ModPackMetaData[], newSelectedModPack: string) {
        let body = table.tBodies[0];

        body.innerHTML = "";

        let rows: HTMLTableRowElement[] = []

        let row = document.createElement('tr');

        let cell1 = document.createElement('td');
        let radio = document.createElement('input') as HTMLInputElement;
        radio.type = 'radio';
        radio.name = 'modPack';
        radio.value = "";
        if (newSelectedModPack === "") {
            radio.checked = true;
        }
        radio.onchange = modPackSelected;
        cell1.appendChild(radio);
        row.appendChild(cell1);

        createCell(row, 'Vanilla (no mods)');

        let cell3 = document.createElement('td');
        cell3.innerText = 'N/A';
        row.appendChild(cell3);

        rows.push(row);

        for (let modPack of modPacks) {
            let row = document.createElement('tr');

            let cell1 = document.createElement('td');
            let radio = document.createElement('input') as HTMLInputElement;
            radio.type = 'radio';
            radio.name = 'modPack';
            radio.value = modPack.Name;
            if (newSelectedModPack === modPack.Name) {
                radio.checked = true;
            }
            radio.onchange = modPackSelected;
            cell1.appendChild(radio);
            row.appendChild(cell1);

            createCell(row, modPack.Name);

            let cell3 = document.createElement('td');
            cell3.innerText = formatDate(modPack.LastModifiedTime);
            row.appendChild(cell3);

            rows.push(row);
        }

        let checkedRadio = document.querySelector('input[type="radio"][name="modPack"]:checked');
        if (checkedRadio === undefined || checkedRadio === null) {
            radio.checked = true;
            selectedModPack = "";
        }

        let jTable = $(table);

        jTable.data('rows', rows);

        let ascending = !jTable.data('ascending');
        jTable.data('ascending', ascending);
        let property = jTable.data('sortProperty');

        sortTable(table, property);
    }

    function modPackSelected(this: HTMLInputElement, ev: MouseEvent) {
        if (this.checked) {
            let modPack = this.value;
            connection.invoke('SetModPack', modPack);
        }
    }

    connection.on('SendSelectedModPack', function (modPack: string) {
        let radios = document.querySelectorAll('input[type="radio"][name="modPack"]');

        selectedModPack = modPack;

        for (let element of radios) {
            let radio = element as HTMLInputElement;
            if (radio.value === modPack) {
                radio.checked = true;
                return;
            }
        }

        let noMod = document.querySelectorAll('input[type="radio"][name="modPack"][value=""]');
        let noModRadio = noMod[0] as HTMLInputElement
        noModRadio.checked = true;
    });

    connection.on('SendModPacks', function (modPacks: ModPackMetaData[]) {
        updateModPackTable(modPackTable, modPacks, selectedModPack);
    });

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

    function createCell(parent: HTMLElement, content: string) {
        let cell = document.createElement('td');
        cell.innerText = content;
        parent.appendChild(cell);
    }

    fileUplaodButton.onclick = () => {
        fileUploadInput.click();
    }

    fileUploadInput.onchange = function (this: HTMLInputElement, ev: Event) {
        if (this.files.length == 0) {
            return;
        }

        let formData = new FormData();
        formData.set('directory', `${serverSelect.value}/local_saves`);

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
            getFiles();

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

        getFiles();
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

        getFiles();
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

        getFiles();
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

        getFiles();
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
        getFiles();

        if (!result.Success) {
            alert(JSON.stringify(result.Errors));
        }
    });

    configSaveButton.onclick = async () => {
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

        let result: Result = await connection.invoke('SaveServerSettings', settings);

        if (!result.Success) {
            alert(JSON.stringify(result.Errors));
        }

        await getSettings();
    };

    configExtraSaveButton.onclick = async () => {
        let settings: FactorioServerExtraSettings = {
            SyncBans: configSyncBans.checked,
            BuildBansFromDatabaseOnStart: configBuildBansFromDb.checked,
            SetDiscordChannelName: configSetDiscordChannelName.checked,
            GameChatToDiscord: configSetGameChatToDiscord.checked,
            GameShoutToDiscord: configSetGameShoutToDiscord.checked,
            DiscordToGameChat: configSetDiscordToGameChat.checked,
        }

        let result: Result = await connection.invoke('SaveServerExtraSettings', settings);

        if (!result.Success) {
            alert(JSON.stringify(result.Errors));
        }

        await getExtraSettings();
    };

    function toggleSelectTable(input: HTMLInputElement, table: HTMLTableElement) {
        let checkboxes = table.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;

        for (let checkbox of checkboxes) {
            checkbox.checked = input.checked;
        }
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

        for (let r of rows) {
            body.appendChild(r);
        }
    }

    start();
}();

