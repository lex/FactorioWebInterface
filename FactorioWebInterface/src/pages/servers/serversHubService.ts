import * as signalR from "@microsoft/signalr";
import { MessagePackHubProtocol } from "@microsoft/signalr-protocol-msgpack"
import { Result, CollectionChangedData, KeyValueCollectionChangedData } from "../../ts/utils";
import { FactorioControlClientData, FactorioServerSettings, FactorioServerExtraSettings, MessageData, FileMetaData, ScenarioMetaData, ModPackMetaData, FactorioServerStatus } from "./serversTypes";
import { Observable, IObservable } from "../../utils/observable";

export interface CollectionChangedDataWithServerId<T> extends CollectionChangedData<T> {
    serverId: string;
}

export class ServersHubService {
    private _connection: signalR.HubConnection;

    private _whenConnection = new Observable<void>();

    private _onDeflateFinished = new Observable<Result>();
    private _onMessage = new Observable<MessageData>();
    private _onFactorioStatusChanged = new Observable<{ newStatus: FactorioServerStatus, oldStatus: FactorioServerStatus }>();
    private _onVersion = new Observable<string>();
    private _onDownloadableVersions = new Observable<string[]>();

    private _selectedModPack = new Observable<string>();
    private _onCachedVersions = new Observable<CollectionChangedData<string>>();
    private _onServerSettings = new Observable<{ settings: FactorioServerSettings, saved: boolean }>();
    private _onServerExtraSettings = new Observable<{ settings: FactorioServerExtraSettings, saved: boolean }>();
    private _onServerSettingsUpdate = new Observable<{ data: KeyValueCollectionChangedData<FactorioServerSettings>, markUnsaved: boolean }>();
    private _onServerExtraSettingsUpdate = new Observable<{ data: KeyValueCollectionChangedData<FactorioServerExtraSettings>, markUnsaved: boolean }>();

    private _tempSaveFiles = new Observable<CollectionChangedDataWithServerId<FileMetaData>>();
    private _localSaveFiles = new Observable<CollectionChangedDataWithServerId<FileMetaData>>();
    private _globalSaveFiles = new Observable<CollectionChangedData<FileMetaData>>();
    private _scenarios = new Observable<CollectionChangedData<ScenarioMetaData>>();
    private _modPacks = new Observable<CollectionChangedData<ModPackMetaData>>();
    private _logFiles = new Observable<CollectionChangedDataWithServerId<FileMetaData>>();
    private _chatLogsFiles = new Observable<CollectionChangedDataWithServerId<FileMetaData>>();

    get onDeflateFinished(): IObservable<Result> {
        return this._onDeflateFinished;
    }

    get onMessage(): IObservable<MessageData> {
        return this._onMessage;
    }

    get onFactorioStatusChanged(): IObservable<{ newStatus: FactorioServerStatus, oldStatus: FactorioServerStatus }> {
        return this._onFactorioStatusChanged;
    }

    get onVersion(): IObservable<string> {
        return this._onVersion;
    }

    get onDownloadableVersions(): IObservable<string[]> {
        return this._onDownloadableVersions;
    }

    get selectedModPack(): IObservable<string> {
        return this._selectedModPack;
    }

    get onCachedVersions(): IObservable<CollectionChangedData<string>> {
        return this._onCachedVersions;
    }

    get onServerSettings(): IObservable<{ settings: FactorioServerSettings, saved: boolean }> {
        return this._onServerSettings;
    }

    get onServerExtraSettings(): IObservable<{ settings: FactorioServerExtraSettings, saved: boolean }> {
        return this._onServerExtraSettings;
    }

    get onServerSettingsUpdate(): IObservable<{ data: KeyValueCollectionChangedData<FactorioServerSettings>, markUnsaved: boolean }> {
        return this._onServerSettingsUpdate;
    }

    get onServerExtraSettingsUpdate(): IObservable<{ data: KeyValueCollectionChangedData<FactorioServerExtraSettings>, markUnsaved: boolean }> {
        return this._onServerExtraSettingsUpdate;
    }

    get tempSaveFiles(): IObservable<CollectionChangedDataWithServerId<FileMetaData>> {
        return this._tempSaveFiles;
    }

    get localSaveFiles(): IObservable<CollectionChangedDataWithServerId<FileMetaData>> {
        return this._localSaveFiles;
    }

    get globalSaveFiles(): IObservable<CollectionChangedData<FileMetaData>> {
        return this._globalSaveFiles;
    }

    get scenarios(): IObservable<CollectionChangedData<ScenarioMetaData>> {
        return this._scenarios;
    }

    get modPacks(): IObservable<CollectionChangedData<ModPackMetaData>> {
        return this._modPacks;
    }

    get logFiles(): IObservable<CollectionChangedDataWithServerId<FileMetaData>> {
        return this._logFiles;
    }

    get chatLogsFiles(): IObservable<CollectionChangedDataWithServerId<FileMetaData>> {
        return this._chatLogsFiles;
    }

    constructor() {
        this._connection = new signalR.HubConnectionBuilder()
            .withUrl("/factorioControlHub")
            .withHubProtocol(new MessagePackHubProtocol())
            .build();

        this._connection.on('DeflateFinished', (result: Result) => {
            this._onDeflateFinished.raise(result);
        })

        this._connection.on('SendMessage', (messageData: MessageData) => {
            this._onMessage.raise(messageData);
        })

        this._connection.on('FactorioStatusChanged', (newStatus: FactorioServerStatus, oldStatus: FactorioServerStatus) => {
            this._onFactorioStatusChanged.raise({ newStatus, oldStatus });
        })

        this._connection.on('SendVersion', (version: string) => {
            this._onVersion.raise(version);
        })

        this._connection.on('SendDownloadableVersions', (versions: string[]) => {
            this._onDownloadableVersions.raise(versions);
        })

        this._connection.on('SendTempSavesFiles', (serverId: string, data: CollectionChangedData<FileMetaData>) => {
            let dataWithId = data as CollectionChangedDataWithServerId<FileMetaData>;
            dataWithId.serverId = serverId;
            this._tempSaveFiles.raise(dataWithId);
        })

        this._connection.on('SendLocalSaveFiles', (serverId: string, data: CollectionChangedData<FileMetaData>) => {
            let dataWithId = data as CollectionChangedDataWithServerId<FileMetaData>;
            dataWithId.serverId = serverId;
            this._localSaveFiles.raise(dataWithId);
        })

        this._connection.on('SendGlobalSaveFiles', (data: CollectionChangedData<FileMetaData>) => {
            this._globalSaveFiles.raise(data);
        })

        this._connection.on('SendScenarios', (data: CollectionChangedData<ScenarioMetaData>) => {
            this._scenarios.raise(data);
        })

        this._connection.on('SendModPacks', (data: CollectionChangedData<ModPackMetaData>) => {
            this._modPacks.raise(data);
        })

        this._connection.on('SendLogFiles', (serverId: string, data: CollectionChangedData<FileMetaData>) => {
            let dataWithId = data as CollectionChangedDataWithServerId<FileMetaData>;
            dataWithId.serverId = serverId;
            this._logFiles.raise(dataWithId);
        })

        this._connection.on('SendChatLogFiles', (serverId: string, data: CollectionChangedData<FileMetaData>) => {
            let dataWithId = data as CollectionChangedDataWithServerId<FileMetaData>;
            dataWithId.serverId = serverId;
            this._chatLogsFiles.raise(dataWithId);
        })

        this._connection.on('SendSelectedModPack', (modPack: string) => {
            this._selectedModPack.raise(modPack);
        })

        this._connection.on('SendCachedVersions', (data: CollectionChangedData<string>) => {
            this._onCachedVersions.raise(data);
        })

        this._connection.on('SendServerSettings', (settings: FactorioServerSettings, saved: boolean) => {
            this._onServerSettings.raise({ settings, saved });
        })

        this._connection.on('SendServerExtraSettings', (settings: FactorioServerExtraSettings, saved: boolean) => {
            this._onServerExtraSettings.raise({ settings, saved });
        })

        this._connection.on('SendServerSettingsUpdate', (data: KeyValueCollectionChangedData<FactorioServerSettings>, markUnsaved: boolean) => {
            this._onServerSettingsUpdate.raise({ data, markUnsaved });
        })

        this._connection.on('SendServerExtraSettingsUpdate', (data: KeyValueCollectionChangedData<FactorioServerExtraSettings>, markUnsaved: boolean) => {
            this._onServerExtraSettingsUpdate.raise({ data, markUnsaved });
        })

        this.startConnection();
    }

    whenConnection(callback: () => void): () => void {
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

    getVersion(): Promise<string> {
        return this._connection.invoke('GetVersion');
    }

    setServerId(serverId: string): Promise<FactorioControlClientData> {
        return this._connection.invoke('SetServerId', serverId);
    }

    sendToFactorio(message: string) {
        this._connection.send("SendToFactorio", message);
    }

    deleteCachedVersion(version: string) {
        this._connection.send('DeleteCachedVersion', version);
    }

    setSelectedModPack(modPack: string) {
        this._connection.send('SetSelectedModPack', modPack);
    }

    updateServerSettings(data: KeyValueCollectionChangedData) {
        this._connection.send('UpdateServerSettings', data);
    }

    undoServerSettings() {
        this._connection.send('UndoServerSettings');
    }

    updateServerExtraSettings(data: KeyValueCollectionChangedData) {
        this._connection.send('UpdateServerExtraSettings', data);
    }

    undoServerExtraSettings() {
        this._connection.send('UndoServerExtraSettings');
    }

    resume(): Promise<Result> {
        return this._connection.invoke('Resume') as Promise<Result>;
    }

    load(directory: string, filename: string): Promise<Result> {
        return this._connection.invoke('Load', directory, filename) as Promise<Result>;
    }

    startScenario(scenario: string): Promise<Result> {
        return this._connection.invoke('StartScenario', scenario) as Promise<Result>;
    }

    stop(): Promise<Result> {
        return this._connection.invoke('Stop') as Promise<Result>;
    }

    forceStop(): Promise<Result> {
        return this._connection.invoke('ForceStop') as Promise<Result>;
    }

    save(): Promise<Result> {
        return this._connection.invoke('Save') as Promise<Result>;
    }

    update(version: string): Promise<Result> {
        return this._connection.invoke('Update', version) as Promise<Result>;
    }

    deleteFiles(files: string[]): Promise<Result> {
        return this._connection.invoke('DeleteFiles', files);
    }

    moveFiles(destination: string, files: string[]): Promise<Result> {
        return this._connection.invoke('MoveFiles', destination, files);
    }

    copyFiles(destination: string, files: string[]): Promise<Result> {
        return this._connection.invoke('CopyFiles', destination, files);
    }

    renameFile(directory: string, name: string, newName: string): Promise<Result> {
        return this._connection.invoke('RenameFile', directory, name, newName);
    }

    deflateSave(directory: string, name: string, newName: string): Promise<Result> {
        return this._connection.invoke('DeflateSave', directory, name, newName);
    }

    saveServerSettings(settings: FactorioServerSettings): Promise<Result> {
        return this._connection.invoke('SaveServerSettings', settings)
    }

    async saveServerExtraSettings(settings: FactorioServerExtraSettings): Promise<Result> {
        return await this._connection.invoke('SaveServerExtraSettings', settings);
    }

    private async startConnection() {
        try {
            await this._connection.start();

            this._whenConnection.raise();
        } catch (ex) {
            console.log(ex.message);
            setTimeout(() => this.startConnection(), 2000);
        }
    }
}