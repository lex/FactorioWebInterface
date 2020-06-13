var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as signalR from "@microsoft/signalr";
import { MessagePackHubProtocol } from "@microsoft/signalr-protocol-msgpack";
import { Observable } from "../../utils/observable";
export class ServersHubService {
    constructor() {
        this._whenConnection = new Observable();
        this._onDeflateFinished = new Observable();
        this._onMessage = new Observable();
        this._onFactorioStatusChanged = new Observable();
        this._onVersion = new Observable();
        this._onDownloadableVersions = new Observable();
        this._selectedModPack = new Observable();
        this._onCachedVersions = new Observable();
        this._onServerSettings = new Observable();
        this._onServerExtraSettings = new Observable();
        this._onServerSettingsUpdate = new Observable();
        this._onServerExtraSettingsUpdate = new Observable();
        this._tempSaveFiles = new Observable();
        this._localSaveFiles = new Observable();
        this._globalSaveFiles = new Observable();
        this._scenarios = new Observable();
        this._modPacks = new Observable();
        this._logFiles = new Observable();
        this._chatLogsFiles = new Observable();
        this._connection = new signalR.HubConnectionBuilder()
            .withUrl("/factorioControlHub")
            .withHubProtocol(new MessagePackHubProtocol())
            .build();
        this._connection.on('DeflateFinished', (result) => {
            this._onDeflateFinished.raise(result);
        });
        this._connection.on('SendMessage', (messageData) => {
            this._onMessage.raise(messageData);
        });
        this._connection.on('FactorioStatusChanged', (newStatus, oldStatus) => {
            this._onFactorioStatusChanged.raise({ newStatus, oldStatus });
        });
        this._connection.on('SendVersion', (version) => {
            this._onVersion.raise(version);
        });
        this._connection.on('SendDownloadableVersions', (versions) => {
            this._onDownloadableVersions.raise(versions);
        });
        this._connection.on('SendTempSavesFiles', (serverId, data) => {
            let dataWithId = data;
            dataWithId.serverId = serverId;
            this._tempSaveFiles.raise(dataWithId);
        });
        this._connection.on('SendLocalSaveFiles', (serverId, data) => {
            let dataWithId = data;
            dataWithId.serverId = serverId;
            this._localSaveFiles.raise(dataWithId);
        });
        this._connection.on('SendGlobalSaveFiles', (data) => {
            this._globalSaveFiles.raise(data);
        });
        this._connection.on('SendScenarios', (data) => {
            this._scenarios.raise(data);
        });
        this._connection.on('SendModPacks', (data) => {
            this._modPacks.raise(data);
        });
        this._connection.on('SendLogFiles', (serverId, data) => {
            let dataWithId = data;
            dataWithId.serverId = serverId;
            this._logFiles.raise(dataWithId);
        });
        this._connection.on('SendChatLogFiles', (serverId, data) => {
            let dataWithId = data;
            dataWithId.serverId = serverId;
            this._chatLogsFiles.raise(dataWithId);
        });
        this._connection.on('SendSelectedModPack', (modPack) => {
            this._selectedModPack.raise(modPack);
        });
        this._connection.on('SendCachedVersions', (data) => {
            this._onCachedVersions.raise(data);
        });
        this._connection.on('SendServerSettings', (settings, saved) => {
            this._onServerSettings.raise({ settings, saved });
        });
        this._connection.on('SendServerExtraSettings', (settings, saved) => {
            this._onServerExtraSettings.raise({ settings, saved });
        });
        this._connection.on('SendServerSettingsUpdate', (data, markUnsaved) => {
            this._onServerSettingsUpdate.raise({ data, markUnsaved });
        });
        this._connection.on('SendServerExtraSettingsUpdate', (data, markUnsaved) => {
            this._onServerExtraSettingsUpdate.raise({ data, markUnsaved });
        });
        this._connection.onclose(() => __awaiter(this, void 0, void 0, function* () {
            yield this.startConnection();
        }));
        this.startConnection();
    }
    get onDeflateFinished() {
        return this._onDeflateFinished;
    }
    get onMessage() {
        return this._onMessage;
    }
    get onFactorioStatusChanged() {
        return this._onFactorioStatusChanged;
    }
    get onVersion() {
        return this._onVersion;
    }
    get onDownloadableVersions() {
        return this._onDownloadableVersions;
    }
    get selectedModPack() {
        return this._selectedModPack;
    }
    get onCachedVersions() {
        return this._onCachedVersions;
    }
    get onServerSettings() {
        return this._onServerSettings;
    }
    get onServerExtraSettings() {
        return this._onServerExtraSettings;
    }
    get onServerSettingsUpdate() {
        return this._onServerSettingsUpdate;
    }
    get onServerExtraSettingsUpdate() {
        return this._onServerExtraSettingsUpdate;
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
    whenConnection(callback) {
        if (this._connection.state === signalR.HubConnectionState.Connected) {
            callback();
        }
        return this._whenConnection.subscribe(callback);
    }
    requestTempSaveFiles() {
        this._connection.send('RequestTempSaveFiles');
    }
    requestLocalSaveFiles() {
        this._connection.send('RequestLocalSaveFiles');
    }
    requestLogFiles() {
        this._connection.send('RequestLogFiles');
    }
    requestChatLogFiles() {
        this._connection.send('RequestChatLogFiles');
    }
    requestServerSettings() {
        this._connection.send('RequestServerSettings');
    }
    requestServerExtraSettings() {
        this._connection.send('RequestServerExtraSettings');
    }
    requestSelectedModPack() {
        this._connection.send('RequestSelectedModPack');
    }
    requestGlobalSaveFiles() {
        this._connection.send('RequestGlobalSaveFiles');
    }
    requestScenarios() {
        this._connection.send('RequestScenarios');
    }
    requestModPacks() {
        this._connection.send('RequestModPacks');
    }
    requestDownloadableVersions() {
        this._connection.send('RequestDownloadableVersions');
    }
    requestCachedVersions() {
        this._connection.send('RequestCachedVersions');
    }
    requestStatus() {
        this._connection.send('GetStatus');
    }
    getVersion() {
        return this._connection.invoke('GetVersion');
    }
    setServerId(serverId) {
        return this._connection.invoke('SetServerId', serverId);
    }
    sendToFactorio(message) {
        this._connection.send("SendToFactorio", message);
    }
    deleteCachedVersion(version) {
        this._connection.send('DeleteCachedVersion', version);
    }
    setSelectedModPack(modPack) {
        this._connection.send('SetSelectedModPack', modPack);
    }
    updateServerSettings(data) {
        this._connection.send('UpdateServerSettings', data);
    }
    undoServerSettings() {
        this._connection.send('UndoServerSettings');
    }
    updateServerExtraSettings(data) {
        this._connection.send('UpdateServerExtraSettings', data);
    }
    undoServerExtraSettings() {
        this._connection.send('UndoServerExtraSettings');
    }
    resume() {
        return this._connection.invoke('Resume');
    }
    load(directory, filename) {
        return this._connection.invoke('Load', directory, filename);
    }
    startScenario(scenario) {
        return this._connection.invoke('StartScenario', scenario);
    }
    stop() {
        return this._connection.invoke('Stop');
    }
    forceStop() {
        return this._connection.invoke('ForceStop');
    }
    save() {
        return this._connection.invoke('Save');
    }
    update(version) {
        return this._connection.invoke('Update', version);
    }
    deleteFiles(files) {
        return this._connection.invoke('DeleteFiles', files);
    }
    moveFiles(destination, files) {
        return this._connection.invoke('MoveFiles', destination, files);
    }
    copyFiles(destination, files) {
        return this._connection.invoke('CopyFiles', destination, files);
    }
    renameFile(directory, name, newName) {
        return this._connection.invoke('RenameFile', directory, name, newName);
    }
    deflateSave(directory, name, newName) {
        return this._connection.invoke('DeflateSave', directory, name, newName);
    }
    saveServerSettings(settings) {
        return this._connection.invoke('SaveServerSettings', settings);
    }
    saveServerExtraSettings(settings) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._connection.invoke('SaveServerExtraSettings', settings);
        });
    }
    startConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this._connection.start();
                this._whenConnection.raise();
            }
            catch (ex) {
                console.log(ex);
                setTimeout(() => this.startConnection(), 2000);
            }
        });
    }
}
//# sourceMappingURL=serversHubService.js.map