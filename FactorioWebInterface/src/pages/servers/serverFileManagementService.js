var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ObservableProperty } from "../../utils/observableProperty";
import { FileUploadEventType } from "../../services/uploadService";
export class ServerFileManagementService {
    constructor(serverIdService, serversHubService, uploadService, windowService) {
        this._deflating = new ObservableProperty(false);
        this._uploading = new ObservableProperty(false);
        this._uploadProgress = new ObservableProperty(0);
        this._serverIdService = serverIdService;
        this._serversHubService = serversHubService;
        this._uploadService = uploadService;
        this._windowsService = windowService;
        serversHubService.onDeflateFinished.subscribe((event) => {
            this._deflating.raise(false);
        });
    }
    get deflating() {
        return this._deflating;
    }
    get uploading() {
        return this._uploading;
    }
    get uploadProgress() {
        return this._uploadProgress;
    }
    deleteFiles(files) {
        return this._serversHubService.deleteFiles(files);
    }
    moveFiles(destination, files) {
        return this._serversHubService.moveFiles(destination, files);
    }
    copyFiles(destination, files) {
        return this._serversHubService.copyFiles(destination, files);
    }
    renameFile(directory, name, newName) {
        return this._serversHubService.renameFile(directory, name, newName);
    }
    deflateSave(directory, name, newName) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield this._serversHubService.deflateSave(directory, name, newName);
            if (result.Success) {
                this._deflating.raise(true);
            }
            return result;
        });
    }
    uploadFiles(files) {
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
                        //this._uploading.raise(true);
                        //this._uploadProgress.raise(0);
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
ServerFileManagementService.fileUploadUrl = '/admin/servers?handler=fileUpload';
//# sourceMappingURL=serverFileManagementService.js.map