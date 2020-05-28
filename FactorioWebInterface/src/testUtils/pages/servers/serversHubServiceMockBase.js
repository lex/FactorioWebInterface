import { InvokeBase } from "../../invokeBase";
import { Observable } from "../../../utils/observable";
import { FactorioServerStatus } from "../../../pages/servers/serversTypes";
export class ServersHubServiceMockBase extends InvokeBase {
    constructor(strict = false) {
        super(strict);
        this._onConnection = new Observable();
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
    }
    get onConnection() {
        this.invoked('onConnection');
        return this._onConnection;
    }
    get onDeflateFinished() {
        this.invoked('onDeflateFinished');
        return this._onDeflateFinished;
    }
    get onMessage() {
        this.invoked('onMessage');
        return this._onMessage;
    }
    get onFactorioStatusChanged() {
        this.invoked('onFactorioStatusChanged');
        return this._onFactorioStatusChanged;
    }
    get onVersion() {
        this.invoked('onVersion');
        return this._onVersion;
    }
    get onDownloadableVersions() {
        this.invoked('onDownloadableVersions');
        return this._onDownloadableVersions;
    }
    get selectedModPack() {
        this.invoked('selectedModPack');
        return this._selectedModPack;
    }
    get onCachedVersions() {
        this.invoked('onCachedVersions');
        return this._onCachedVersions;
    }
    get onServerSettings() {
        this.invoked('onServerSettings');
        return this._onServerSettings;
    }
    get onServerExtraSettings() {
        this.invoked('onServerExtraSettings');
        return this._onServerExtraSettings;
    }
    get onServerSettingsUpdate() {
        this.invoked('onServerSettingsUpdate');
        return this._onServerSettingsUpdate;
    }
    get onServerExtraSettingsUpdate() {
        this.invoked('onServerExtraSettingsUpdate');
        return this._onServerExtraSettingsUpdate;
    }
    get tempSaveFiles() {
        this.invoked('tempSaveFiles');
        return this._tempSaveFiles;
    }
    get localSaveFiles() {
        this.invoked('localSaveFiles');
        return this._localSaveFiles;
    }
    get globalSaveFiles() {
        this.invoked('globalSaveFiles');
        return this._globalSaveFiles;
    }
    get scenarios() {
        this.invoked('scenarios');
        return this._scenarios;
    }
    get modPacks() {
        this.invoked('modPacks');
        return this._modPacks;
    }
    get logFiles() {
        this.invoked('logFiles');
        return this._logFiles;
    }
    get chatLogsFiles() {
        this.invoked('chatLogsFiles');
        return this._chatLogsFiles;
    }
    requestTempSaveFiles() {
        this.invoked('requestTempSaveFiles');
    }
    requestLocalSaveFiles() {
        this.invoked('requestLocalSaveFiles');
    }
    requestLogFiles() {
        this.invoked('requestLogFiles');
    }
    requestChatLogFiles() {
        this.invoked('requestChatLogFiles');
    }
    requestServerSettings() {
        this.invoked('requestServerSettings');
    }
    requestServerExtraSettings() {
        this.invoked('requestServerExtraSettings');
    }
    requestSelectedModPack() {
        this.invoked('requestSelectedModPack');
    }
    requestGlobalSaveFiles() {
        this.invoked('requestGlobalSaveFiles');
    }
    requestScenarios() {
        this.invoked('requestScenarios');
    }
    requestModPacks() {
        this.invoked('requestModPacks');
    }
    requestDownloadableVersions() {
        this.invoked('requestDownloadableVersions');
    }
    requestCachedVersions() {
        this.invoked('requestCachedVersions');
    }
    requestStatus() {
        this.invoked('requestStatus');
    }
    getVersion() {
        this.invoked('getVersion');
        return Promise.resolve('0.0.0');
    }
    setServerId(serverId) {
        this.invoked('setServerId', serverId);
        return Promise.resolve({ Status: FactorioServerStatus.Unknown, Messages: [] });
    }
    sendToFactorio(message) {
        this.invoked('sendToFactorio', message);
    }
    deleteCachedVersion(version) {
        this.invoked('deleteCachedVersion', version);
    }
    setSelectedModPack(modPack) {
        this.invoked('setSelectedModPack', modPack);
    }
    updateServerSettings(data) {
        this.invoked('updateServerSettings', data);
    }
    undoServerSettings() {
        this.invoked('undoServerSettings');
    }
    updateServerExtraSettings(data) {
        this.invoked('updateServerExtraSettings', data);
    }
    undoServerExtraSettings() {
        this.invoked('undoServerExtraSettings');
    }
    resume() {
        this.invoked('resume');
        return Promise.resolve({ Success: true });
    }
    load(directory, filename) {
        this.invoked('load', directory, filename);
        return Promise.resolve({ Success: true });
    }
    startScenario(scenario) {
        this.invoked('startScenario', scenario);
        return Promise.resolve({ Success: true });
    }
    stop() {
        this.invoked('stop');
        return Promise.resolve({ Success: true });
    }
    forceStop() {
        this.invoked('forceStop');
        return Promise.resolve({ Success: true });
    }
    save() {
        this.invoked('save');
        return Promise.resolve({ Success: true });
    }
    update(version) {
        this.invoked('update', version);
        return Promise.resolve({ Success: true });
    }
    deleteFiles(files) {
        this.invoked('deleteFiles', files);
        return Promise.resolve({ Success: true });
    }
    moveFiles(destination, files) {
        this.invoked('moveFiles', destination, files);
        return Promise.resolve({ Success: true });
    }
    copyFiles(destination, files) {
        this.invoked('copyFiles', destination, files);
        return Promise.resolve({ Success: true });
    }
    renameFile(directory, name, newName) {
        this.invoked('renameFile', directory, name, newName);
        return Promise.resolve({ Success: true });
    }
    deflateSave(directory, name, newName) {
        this.invoked('deflateSave', directory, name, newName);
        return Promise.resolve({ Success: true });
    }
    saveServerSettings(settings) {
        this.invoked('saveServerSettings', settings);
        return Promise.resolve({ Success: true });
    }
    saveServerExtraSettings(settings) {
        this.invoked('saveServerExtraSettings', settings);
        return Promise.resolve({ Success: true });
    }
}
//# sourceMappingURL=serversHubServiceMockBase.js.map