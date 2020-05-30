import { ServerIdService } from "./serverIdService";
import { ServersHubService } from "./serversHubService";
import { FileMetaData, ScenarioMetaData, ModPackMetaData } from "./serversTypes";
import { ObservableKeyArray, ObservableCollection } from "../../utils/observableCollection";
import { ObservableProperty, IObservableProperty } from "../../utils/observableProperty";

export class ServerFileService {
    static readonly fileMetaDataKeySelector = (file: FileMetaData) => file.Name;
    static readonly scenarioMetaDataKeySelector = (scenario: ScenarioMetaData) => scenario.Name;
    static readonly modPackMetaDataKeySelector = (modPack: ScenarioMetaData) => modPack.Name;

    private _serverIdService: ServerIdService;
    private _serversHubService: ServersHubService;

    private _tempSaveFiles = new ObservableKeyArray<string, FileMetaData>(ServerFileService.fileMetaDataKeySelector);
    private _localSaveFiles = new ObservableKeyArray<string, FileMetaData>(ServerFileService.fileMetaDataKeySelector);
    private _globalSaveFiles = new ObservableKeyArray<string, FileMetaData>(ServerFileService.fileMetaDataKeySelector);
    private _scenarios = new ObservableKeyArray<string, ScenarioMetaData>(ServerFileService.scenarioMetaDataKeySelector);
    private _modPacks = new ObservableKeyArray<string, ModPackMetaData>(ServerFileService.modPackMetaDataKeySelector);
    private _logFiles = new ObservableKeyArray<string, FileMetaData>(ServerFileService.fileMetaDataKeySelector);
    private _chatLogsFiles = new ObservableKeyArray<string, FileMetaData>(ServerFileService.fileMetaDataKeySelector);

    private _selectedModPack = new ObservableProperty<string>('');

    get tempSaveFiles(): ObservableCollection<FileMetaData> {
        return this._tempSaveFiles;
    }

    get localSaveFiles(): ObservableCollection<FileMetaData> {
        return this._localSaveFiles;
    }

    get globalSaveFiles(): ObservableCollection<FileMetaData> {
        return this._globalSaveFiles;
    }

    get scenarios(): ObservableCollection<ScenarioMetaData> {
        return this._scenarios;
    }

    get modPacks(): ObservableCollection<ModPackMetaData> {
        return this._modPacks;
    }

    get logFiles(): ObservableCollection<FileMetaData> {
        return this._logFiles;
    }

    get chatLogsFiles(): ObservableCollection<FileMetaData> {
        return this._chatLogsFiles;
    }

    get selectedModPack(): IObservableProperty<string> {
        return this._selectedModPack;
    }

    constructor(serverIdService: ServerIdService, serversHubService: ServersHubService) {
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

        serversHubService.whenConnection(() => {
            this.updateLocalFiles();
            this.updateGlobalFiles();
        })

        serverIdService.serverId.subscribe(newServerId => {
            this.updateLocalFiles();
        });
    }

    setSelectedModPack(modPack: string) {
        if (this._selectedModPack.value === modPack) {
            return;
        }

        this._serversHubService.setSelectedModPack(modPack);
    }

    private updateLocalFiles() {
        let hub = this._serversHubService;
        hub.requestTempSaveFiles();
        hub.requestLocalSaveFiles();
        hub.requestLogFiles();
        hub.requestChatLogFiles();
        hub.requestSelectedModPack();
    }

    private updateGlobalFiles() {
        let hub = this._serversHubService;
        hub.requestGlobalSaveFiles();
        hub.requestScenarios();
        hub.requestModPacks();
    }
}