import { ModsHubService } from "./modsHubService";
import { ObservableProperty, IObservableProperty } from "../../utils/observableProperty";
import { ModPackFileMetaData, ModPackMetaData } from "../servers/serversTypes";
import { Result } from "../../ts/utils";
import { UploadService, FileUploadEventType } from "../../services/uploadService";
import { WindowService } from "../../services/windowService";
import { Observable, IObservable } from "../../utils/observable";
import { ObservableKeyArray, ObservableCollection } from "../../utils/collections/module";

export class ModsService {
    static readonly fileUploadUrl = '/admin/mods?handler=UploadFiles';

    private _modsHubService: ModsHubService;
    private _uploadService: UploadService;
    private _windowsService: WindowService;

    private _selectedModPack = new ObservableProperty<string>();
    private _modPacks = new ObservableKeyArray<string, ModPackMetaData>(x => x.Name);
    private _selectedModPackFiles = new ObservableKeyArray<string, ModPackFileMetaData>(x => x.Name);
    private _onEndDownloadResult = new Observable<Result>();

    private _uploading = new ObservableProperty<boolean>(false);
    private _uploadProgress = new ObservableProperty<number>(0);
    private _downloading = new ObservableProperty<boolean>(false);

    get selectedModPack(): IObservableProperty<string> {
        return this._selectedModPack;
    }

    get modPacks(): ObservableCollection<ModPackMetaData> {
        return this._modPacks;
    }

    get selectedModPackFiles(): ObservableCollection<ModPackFileMetaData> {
        return this._selectedModPackFiles;
    }

    get uploading(): IObservableProperty<boolean> {
        return this._uploading;
    }

    get uploadProgress(): IObservableProperty<number> {
        return this._uploadProgress;
    }

    get downloading(): IObservableProperty<boolean> {
        return this._downloading;
    }

    get onEndDownloadResult(): IObservable<Result> {
        return this._onEndDownloadResult;
    }

    constructor(modsHubService: ModsHubService, uploadService: UploadService, windowService: WindowService) {
        this._modsHubService = modsHubService;
        this._uploadService = uploadService;
        this._windowsService = windowService;

        modsHubService.onSendModPacks.subscribe(event => {
            this._modPacks.update(event);

            if (!this._modPacks.has(this._selectedModPack.value)) {
                this._selectedModPack.raise(undefined);
            }
        });

        modsHubService.onSendModPackFiles.subscribe(event => {
            if (event.modPack !== this._selectedModPack.value) {
                return;
            }

            this._selectedModPackFiles.update(event.data);
        });

        modsHubService.onEndDownloadFromModPortal.subscribe(event => {
            this._downloading.raise(false);
            this._onEndDownloadResult.raise(event);
        })

        modsHubService.whenConnection(() => {
            modsHubService.requestModPacks();

            let selectedModPack = this._selectedModPack.value
            if (selectedModPack != null) {
                this._modsHubService.requestModPackFiles(selectedModPack);
            }
        });
    }

    setSelectedModPack(modPack: string): void {
        let old = this._selectedModPack.value;
        if (old === modPack) {
            return;
        }

        if (modPack != null) {
            this._modsHubService.requestModPackFiles(modPack);
        }

        this._selectedModPack.raise(modPack);
        this._selectedModPackFiles.reset();
    }

    deleteModPack(modPack: string): Promise<Result> {
        return this._modsHubService.deleteModPack(modPack);
    }

    deleteModPackFiles(fileNames: string[]): Promise<Result> {
        let modPack = this._selectedModPack.value;
        return this._modsHubService.deleteModPackFiles(modPack, fileNames);
    }

    createModPack(name: string): Promise<Result> {
        return this._modsHubService.createModPack(name);
    }

    async renameModPack(oldName: string, newName: string): Promise<Result> {
        let oldSelectedModPack = this._selectedModPack.value;

        let result = await this._modsHubService.renameModPack(oldName, newName);

        if (result.Success && oldSelectedModPack === oldName) {
            this._selectedModPack.raise(newName);
        }

        return result;
    }

    copyModPackFiles(targetModPack: string, fileNames: string[]): Promise<Result> {
        let modPack = this._selectedModPack.value;
        return this._modsHubService.copyModPackFiles(modPack, targetModPack, fileNames);
    }

    moveModPackFiles(targetModPack: string, fileNames: string[]): Promise<Result> {
        let modPack = this._selectedModPack.value;
        return this._modsHubService.moveModPackFiles(modPack, targetModPack, fileNames);
    }

    async downloadFromModPortal(fileNames: string[]) {
        let modPack = this._selectedModPack.value;
        this._modsHubService.downloadFromModPortal(modPack, fileNames);

        this._downloading.raise(true);
    }

    uploadFiles(files: File[]): Promise<Result> {
        let modPack = this._selectedModPack.value;

        let formData = this._windowsService.createFormData();

        formData.append('modPack', modPack);
        for (let file of files) {
            formData.append('files', file);
        }

        this._uploading.raise(true);
        this._uploadProgress.raise(0);

        return new Promise(resolve => {
            this._uploadService.uploadFormData(ModsService.fileUploadUrl, formData, (event) => {
                switch (event.type) {
                    case FileUploadEventType.start:
                        break;
                    case FileUploadEventType.progress:
                        let progress = event.loaded / event.total;
                        this._uploadProgress.raise(progress);
                        break;
                    case FileUploadEventType.end:
                        this._uploading.raise(false);
                        resolve(event.result);
                        break;
                }
            });
        });
    }
}