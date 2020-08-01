import { InvokeBase } from "../../invokeBase";
import { ModsHubService } from "../../../pages/mods/modsHubService";
import { PublicPart } from "../../../utils/types";
import { IObservable, Observable } from "../../../utils/observable";
import { CollectionChangedData, Result } from "../../../ts/utils";
import { ModPackMetaData, ModPackFileMetaData } from "../../../pages/servers/serversTypes";

export class ModsHubServiceMockBase extends InvokeBase<ModsHubService> implements PublicPart<ModsHubService>{
    _onConnection = new Observable<void>();

    _onSendModPacks = new Observable<CollectionChangedData<ModPackMetaData>>();
    _onSendModPackFiles = new Observable<{ modPack: string, data: CollectionChangedData<ModPackFileMetaData> }>();
    _onEndDownloadFromModPortal = new Observable<Result>();

    get onSendModPacks(): IObservable<CollectionChangedData<ModPackMetaData>> {
        this.invoked('onSendModPacks');
        return this._onSendModPacks;
    }

    get onSendModPackFiles(): IObservable<{ modPack: string; data: CollectionChangedData<ModPackFileMetaData>; }> {
        this.invoked('onSendModPackFiles');
        return this._onSendModPackFiles;
    }

    get onEndDownloadFromModPortal(): IObservable<Result<void>> {
        this.invoked('onEndDownloadFromModPortal');
        return this._onEndDownloadFromModPortal;
    }

    whenConnection(callback: () => void): () => void {
        this.invoked('whenConnection', callback);
        return this._onConnection.subscribe(callback);
    }

    requestModPacks(): void {
        this.invoked('requestModPacks');
    }

    requestModPackFiles(modPack: string): void {
        this.invoked('requestModPackFiles', modPack);
    }

    deleteModPack(modPack: string): Promise<Result<void>> {
        this.invoked('deleteModPack', modPack);
        return Promise.resolve({ Success: true });
    }

    deleteModPackFiles(modPack: string, fileNames: string[]): Promise<Result<void>> {
        this.invoked('deleteModPackFiles', modPack, fileNames);
        return Promise.resolve({ Success: true });
    }

    createModPack(name: string): Promise<Result<void>> {
        this.invoked('createModPack', name);
        return Promise.resolve({ Success: true });
    }

    renameModPack(oldName: string, newName: string): Promise<Result<void>> {
        this.invoked('renameModPack', oldName, newName);
        return Promise.resolve({ Success: true });
    }

    copyModPackFiles(modPack: string, targetModPack: string, fileNames: string[]): Promise<Result<void>> {
        this.invoked('copyModPackFiles', modPack, targetModPack, fileNames);
        return Promise.resolve({ Success: true });
    }

    moveModPackFiles(modPack: string, targetModPack: string, fileNames: string[]): Promise<Result<void>> {
        this.invoked('moveModPackFiles', modPack, targetModPack, fileNames);
        return Promise.resolve({ Success: true });
    }

    downloadFromModPortal(modPack: string, fileNames: string[]): void {
        this.invoked('downloadFromModPortal', modPack, fileNames);
    }
}