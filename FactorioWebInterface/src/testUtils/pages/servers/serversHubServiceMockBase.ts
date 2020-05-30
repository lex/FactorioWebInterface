import { InvokeBase } from "../../invokeBase";
import { PublicPart } from "../../../utils/types";
import { ServersHubService, CollectionChangedDataWithServerId } from "../../../pages/servers/serversHubService";
import { IObservable, Observable } from "../../../utils/observable";
import { Result, CollectionChangedData, KeyValueCollectionChangedData } from "../../../ts/utils";
import { MessageData, FileMetaData, ScenarioMetaData, ModPackMetaData, FactorioServerSettings, FactorioServerExtraSettings, FactorioControlClientData, FactorioServerStatus } from "../../../pages/servers/serversTypes";

export class ServersHubServiceMockBase extends InvokeBase<ServersHubService> implements PublicPart<ServersHubService> {
    _onConnection = new Observable<void>();

    _onDeflateFinished = new Observable<Result>();
    _onMessage = new Observable<MessageData>();
    _onFactorioStatusChanged = new Observable<{ newStatus: FactorioServerStatus, oldStatus: FactorioServerStatus }>();
    _onVersion = new Observable<string>();
    _onDownloadableVersions = new Observable<string[]>();

    _selectedModPack = new Observable<string>();
    _onCachedVersions = new Observable<CollectionChangedData<string>>();
    _onServerSettings = new Observable<{ settings: FactorioServerSettings, saved: boolean }>();
    _onServerExtraSettings = new Observable<{ settings: FactorioServerExtraSettings, saved: boolean }>();
    _onServerSettingsUpdate = new Observable<{ data: KeyValueCollectionChangedData<FactorioServerSettings>, markUnsaved: boolean }>();
    _onServerExtraSettingsUpdate = new Observable<{ data: KeyValueCollectionChangedData<FactorioServerExtraSettings>, markUnsaved: boolean }>();

    _tempSaveFiles = new Observable<CollectionChangedDataWithServerId<FileMetaData>>();
    _localSaveFiles = new Observable<CollectionChangedDataWithServerId<FileMetaData>>();
    _globalSaveFiles = new Observable<CollectionChangedData<FileMetaData>>();
    _scenarios = new Observable<CollectionChangedData<ScenarioMetaData>>();
    _modPacks = new Observable<CollectionChangedData<ModPackMetaData>>();
    _logFiles = new Observable<CollectionChangedDataWithServerId<FileMetaData>>();
    _chatLogsFiles = new Observable<CollectionChangedDataWithServerId<FileMetaData>>();

    get onDeflateFinished(): IObservable<Result<void>> {
        this.invoked('onDeflateFinished');
        return this._onDeflateFinished;
    }

    get onMessage(): IObservable<MessageData> {
        this.invoked('onMessage');
        return this._onMessage;
    }

    get onFactorioStatusChanged(): IObservable<{ newStatus: FactorioServerStatus; oldStatus: FactorioServerStatus; }> {
        this.invoked('onFactorioStatusChanged');
        return this._onFactorioStatusChanged;
    }

    get onVersion(): IObservable<string> {
        this.invoked('onVersion');
        return this._onVersion;
    }

    get onDownloadableVersions(): IObservable<string[]> {
        this.invoked('onDownloadableVersions');
        return this._onDownloadableVersions;
    }

    get selectedModPack(): IObservable<string> {
        this.invoked('selectedModPack');
        return this._selectedModPack;
    }

    get onCachedVersions(): IObservable<CollectionChangedData<string>> {
        this.invoked('onCachedVersions');
        return this._onCachedVersions;
    }

    get onServerSettings(): IObservable<{ settings: FactorioServerSettings; saved: boolean; }> {
        this.invoked('onServerSettings');
        return this._onServerSettings;
    }

    get onServerExtraSettings(): IObservable<{ settings: FactorioServerExtraSettings; saved: boolean; }> {
        this.invoked('onServerExtraSettings');
        return this._onServerExtraSettings;
    }

    get onServerSettingsUpdate(): IObservable<{ data: KeyValueCollectionChangedData<FactorioServerSettings>; markUnsaved: boolean; }> {
        this.invoked('onServerSettingsUpdate');
        return this._onServerSettingsUpdate;
    }

    get onServerExtraSettingsUpdate(): IObservable<{ data: KeyValueCollectionChangedData<FactorioServerExtraSettings>; markUnsaved: boolean; }> {
        this.invoked('onServerExtraSettingsUpdate');
        return this._onServerExtraSettingsUpdate;
    }

    get tempSaveFiles(): IObservable<CollectionChangedDataWithServerId<FileMetaData>> {
        this.invoked('tempSaveFiles');
        return this._tempSaveFiles;
    }

    get localSaveFiles(): IObservable<CollectionChangedDataWithServerId<FileMetaData>> {
        this.invoked('localSaveFiles');
        return this._localSaveFiles;
    }

    get globalSaveFiles(): IObservable<CollectionChangedData<FileMetaData>> {
        this.invoked('globalSaveFiles');
        return this._globalSaveFiles;
    }

    get scenarios(): IObservable<CollectionChangedData<ScenarioMetaData>> {
        this.invoked('scenarios');
        return this._scenarios;
    }

    get modPacks(): IObservable<CollectionChangedData<ModPackMetaData>> {
        this.invoked('modPacks');
        return this._modPacks;
    }

    get logFiles(): IObservable<CollectionChangedDataWithServerId<FileMetaData>> {
        this.invoked('logFiles');
        return this._logFiles;
    }

    get chatLogsFiles(): IObservable<CollectionChangedDataWithServerId<FileMetaData>> {
        this.invoked('chatLogsFiles');
        return this._chatLogsFiles;
    }

    constructor(strict: boolean = false) {
        super(strict);
    }

    whenConnection(callback: () => void): () => void {
        this.invoked('whenConnection');
        return this._onConnection.subscribe(callback);
    }

    requestTempSaveFiles(): void {
        this.invoked('requestTempSaveFiles');
    }

    requestLocalSaveFiles(): void {
        this.invoked('requestLocalSaveFiles');
    }

    requestLogFiles(): void {
        this.invoked('requestLogFiles');
    }

    requestChatLogFiles(): void {
        this.invoked('requestChatLogFiles');
    }

    requestServerSettings(): void {
        this.invoked('requestServerSettings');
    }

    requestServerExtraSettings(): void {
        this.invoked('requestServerExtraSettings');
    }

    requestSelectedModPack(): void {
        this.invoked('requestSelectedModPack');
    }

    requestGlobalSaveFiles(): void {
        this.invoked('requestGlobalSaveFiles');
    }

    requestScenarios(): void {
        this.invoked('requestScenarios');
    }

    requestModPacks(): void {
        this.invoked('requestModPacks');
    }

    requestDownloadableVersions(): void {
        this.invoked('requestDownloadableVersions');
    }

    requestCachedVersions(): void {
        this.invoked('requestCachedVersions');
    }

    requestStatus(): void {
        this.invoked('requestStatus');
    }

    getVersion(): Promise<string> {
        this.invoked('getVersion');
        return Promise.resolve('0.0.0');
    }

    setServerId(serverId: string): Promise<FactorioControlClientData> {
        this.invoked('setServerId', serverId);
        return Promise.resolve({ Status: FactorioServerStatus.Unknown, Messages: [] });
    }

    sendToFactorio(message: string): void {
        this.invoked('sendToFactorio', message);
    }

    deleteCachedVersion(version: string): void {
        this.invoked('deleteCachedVersion', version);
    }

    setSelectedModPack(modPack: string): void {
        this.invoked('setSelectedModPack', modPack);
    }

    updateServerSettings(data: KeyValueCollectionChangedData<any>): void {
        this.invoked('updateServerSettings', data);
    }

    undoServerSettings(): void {
        this.invoked('undoServerSettings');
    }

    updateServerExtraSettings(data: KeyValueCollectionChangedData<any>): void {
        this.invoked('updateServerExtraSettings', data);
    }

    undoServerExtraSettings(): void {
        this.invoked('undoServerExtraSettings');
    }

    resume(): Promise<Result> {
        this.invoked('resume');
        return Promise.resolve({ Success: true });
    }

    load(directory: string, filename: string): Promise<Result> {
        this.invoked('load', directory, filename);
        return Promise.resolve({ Success: true });
    }

    startScenario(scenario: string): Promise<Result> {
        this.invoked('startScenario', scenario);
        return Promise.resolve({ Success: true });
    }

    stop(): Promise<Result> {
        this.invoked('stop');
        return Promise.resolve({ Success: true });
    }

    forceStop(): Promise<Result> {
        this.invoked('forceStop');
        return Promise.resolve({ Success: true });
    }

    save(): Promise<Result> {
        this.invoked('save');
        return Promise.resolve({ Success: true });
    }

    update(version: string): Promise<Result> {
        this.invoked('update', version);
        return Promise.resolve({ Success: true });
    }

    deleteFiles(files: string[]): Promise<Result> {
        this.invoked('deleteFiles', files);
        return Promise.resolve({ Success: true });
    }

    moveFiles(destination: string, files: string[]): Promise<Result> {
        this.invoked('moveFiles', destination, files);
        return Promise.resolve({ Success: true });
    }

    copyFiles(destination: string, files: string[]): Promise<Result> {
        this.invoked('copyFiles', destination, files);
        return Promise.resolve({ Success: true });
    }

    renameFile(directory: string, name: string, newName: string): Promise<Result> {
        this.invoked('renameFile', directory, name, newName);
        return Promise.resolve({ Success: true });
    }

    deflateSave(directory: string, name: string, newName: string): Promise<Result> {
        this.invoked('deflateSave', directory, name, newName);
        return Promise.resolve({ Success: true });
    }

    saveServerSettings(settings: FactorioServerSettings): Promise<Result> {
        this.invoked('saveServerSettings', settings);
        return Promise.resolve({ Success: true });
    }

    saveServerExtraSettings(settings: FactorioServerExtraSettings): Promise<Result> {
        this.invoked('saveServerExtraSettings', settings);
        return Promise.resolve({ Success: true });
    }
}