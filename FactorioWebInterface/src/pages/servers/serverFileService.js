import { ObservableKeyArray } from "../../utils/observableCollection";
import { ObservableProperty } from "../../utils/observableProperty";
export class ServerFileService {
    constructor(serverIdService, serversHubService) {
        this._tempSaveFiles = new ObservableKeyArray(ServerFileService.fileMetaDataKeySelector);
        this._localSaveFiles = new ObservableKeyArray(ServerFileService.fileMetaDataKeySelector);
        this._globalSaveFiles = new ObservableKeyArray(ServerFileService.fileMetaDataKeySelector);
        this._scenarios = new ObservableKeyArray(ServerFileService.scenarioMetaDataKeySelector);
        this._modPacks = new ObservableKeyArray(ServerFileService.modPackMetaDataKeySelector);
        this._logFiles = new ObservableKeyArray(ServerFileService.fileMetaDataKeySelector);
        this._chatLogsFiles = new ObservableKeyArray(ServerFileService.fileMetaDataKeySelector);
        this._selectedModPack = new ObservableProperty('');
        this._serverIdService = serverIdService;
        this._serversHubService = serversHubService;
        serversHubService.tempSaveFiles.subscribe(event => {
            if (this._serverIdService.currentServerId === event.serverId) {
                this._tempSaveFiles.update(event);
            }
        });
        serversHubService.localSaveFiles.subscribe(event => {
            if (this._serverIdService.currentServerId === event.serverId) {
                this._localSaveFiles.update(event);
            }
        });
        serversHubService.globalSaveFiles.subscribe(event => {
            this._globalSaveFiles.update(event);
        });
        serversHubService.scenarios.subscribe(event => {
            this._scenarios.update(event);
        });
        serversHubService.modPacks.subscribe(event => {
            this._modPacks.update(event);
        });
        serversHubService.logFiles.subscribe(event => {
            if (this._serverIdService.currentServerId === event.serverId) {
                this._logFiles.update(event);
            }
        });
        serversHubService.chatLogsFiles.subscribe(event => {
            if (this._serverIdService.currentServerId === event.serverId) {
                this._chatLogsFiles.update(event);
            }
        });
        serversHubService.onConnection.subscribe(() => {
            this.updateLocalFiles();
            this.updateGlobalFiles();
        });
        serverIdService.serverId.subscribe(newServerId => {
            this.updateLocalFiles();
        });
    }
    get tempSaveFiles() {
        return this._tempSaveFiles;
    }
    get localSaveFiles() {
        return this._localSaveFiles;
    }
    get globalSaveFiles() {
        return this._globalSaveFiles;
    }
    get scenarios() {
        return this._scenarios;
    }
    get modPacks() {
        return this._modPacks;
    }
    get logFiles() {
        return this._logFiles;
    }
    get chatLogsFiles() {
        return this._chatLogsFiles;
    }
    get selectedModPack() {
        return this._selectedModPack;
    }
    setSelectedModPack(modPack) {
        if (this._selectedModPack.value === modPack) {
            return;
        }
        this._serversHubService.setSelectedModPack(modPack);
    }
    updateLocalFiles() {
        let hub = this._serversHubService;
        hub.requestTempSaveFiles();
        hub.requestLocalSaveFiles();
        hub.requestLogFiles();
        hub.requestChatLogFiles();
        hub.requestSelectedModPack();
    }
    updateGlobalFiles() {
        let hub = this._serversHubService;
        hub.requestGlobalSaveFiles();
        hub.requestScenarios();
        hub.requestModPacks();
    }
}
ServerFileService.fileMetaDataKeySelector = (file) => file.Name;
ServerFileService.scenarioMetaDataKeySelector = (scenario) => scenario.Name;
ServerFileService.modPackMetaDataKeySelector = (modPack) => modPack.Name;
//# sourceMappingURL=serverFileService.js.map