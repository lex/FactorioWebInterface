import { ServersHubService } from "./serversHubService";
import { Result } from "../../ts/utils";
import { ObservableProperty, IObservableProperty } from "../../utils/observableProperty";
import { ServerIdService } from "./serverIdService";
import { UploadService, FileUploadEventType } from "../../services/uploadService";
import { WindowService } from "../../services/windowService";

export class ServerFileManagementService {
    static readonly fileUploadUrl = '/admin/servers?handler=fileUpload';

    private _serverIdService: ServerIdService;
    private _serversHubService: ServersHubService;
    private _uploadService: UploadService;
    private _windowsService: WindowService;

    private _deflating = new ObservableProperty<boolean>(false);
    private _uploading = new ObservableProperty<boolean>(false);
    private _uploadProgress = new ObservableProperty<number>(0);

    get deflating(): IObservableProperty<boolean> {
        return this._deflating;
    }

    get uploading(): IObservableProperty<boolean> {
        return this._uploading;
    }

    get uploadProgress(): IObservableProperty<number> {
        return this._uploadProgress;
    }

    constructor(serverIdService: ServerIdService, serversHubService: ServersHubService, uploadService: UploadService, windowService: WindowService) {
        this._serverIdService = serverIdService;
        this._serversHubService = serversHubService;
        this._uploadService = uploadService;
        this._windowsService = windowService;

        serversHubService.onDeflateFinished.subscribe((event: Result) => {
            this._deflating.raise(false);
        });
    }

    deleteFiles(files: string[]): Promise<Result> {
        return this._serversHubService.deleteFiles(files);
    }

    moveFiles(destination: string, files: string[]): Promise<Result> {
        return this._serversHubService.moveFiles(destination, files);
    }

    copyFiles(destination: string, files: string[]): Promise<Result> {
        return this._serversHubService.copyFiles(destination, files);
    }

    renameFile(directory: string, name: string, newName: string): Promise<Result> {
        return this._serversHubService.renameFile(directory, name, newName);
    }

    async deflateSave(directory: string, name: string, newName: string): Promise<Result> {
        let result = await this._serversHubService.deflateSave(directory, name, newName) as Result;

        if (result.Success) {
            this._deflating.raise(true);
        }

        return result;
    }

    uploadFiles(files: File[]): Promise<Result> {
        let formData = this._windowsService.createFormData();

        formData.append('serverId', this._serverIdService.currentServerId);
        for (let file of files) {
            formData.append('files', file);
        }

        this._uploading.raise(true);
        this._uploadProgress.raise(0);

        return new Promise(resolve => {
            this._uploadService.uploadFormData(ServerFileManagementService.fileUploadUrl, formData, (event) => {
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