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
import { ObservableKeyArray } from "../../utils/observableCollection";
import { FileUploadEventType } from "../../services/uploadService";
import { Observable } from "../../utils/observable";
export class ModsService {
    constructor(modsHubService, uploadService, windowService) {
        this._selectedModPack = new ObservableProperty();
        this._modPacks = new ObservableKeyArray(x => x.Name);
        this._selectedModPackFiles = new ObservableKeyArray(x => x.Name);
        this._onEndDownloadResult = new Observable();
        this._uploading = new ObservableProperty(false);
        this._uploadProgress = new ObservableProperty(0);
        this._downloading = new ObservableProperty(false);
        this._modsHubService = modsHubService;
        this._uploadService = uploadService;
        this._windowsService = windowService;
        modsHubService.onSendModPacks.subscribe(event => this._modPacks.update(event));
        modsHubService.onSendModPackFiles.subscribe(event => {
            if (event.modPack !== this._selectedModPack.value) {
                return;
            }
            this._selectedModPackFiles.update(event.data);
        });
        modsHubService.onEndDownloadFromModPortal.subscribe(event => {
            this._downloading.raise(false);
            this._onEndDownloadResult.raise(event);
        });
        modsHubService.whenConnection(() => {
            modsHubService.requestModPacks();
        });
    }
    get selectedModPack() {
        return this._selectedModPack;
    }
    get modPacks() {
        return this._modPacks;
    }
    get selectedModPackFiles() {
        return this._selectedModPackFiles;
    }
    get uploading() {
        return this._uploading;
    }
    get uploadProgress() {
        return this._uploadProgress;
    }
    get downloading() {
        return this._downloading;
    }
    get onEndDownloadResult() {
        return this._onEndDownloadResult;
    }
    setSelectedModPack(modPack) {
        this._selectedModPack.raise(modPack);
    }
    deleteModPack(modPack) {
        return this._modsHubService.deleteModPack(modPack);
    }
    deleteModPackFiles(fileNames) {
        let modPack = this._selectedModPack.value;
        return this._modsHubService.deleteModPackFiles(modPack, fileNames);
    }
    createModPack(name) {
        return this._modsHubService.createModPack(name);
    }
    renameModPack(oldName, newName) {
        return this._modsHubService.renameModPack(oldName, newName);
    }
    copyModPackFiles(targetModPack, fileNames) {
        let modPack = this._selectedModPack.value;
        return this._modsHubService.copyModPackFiles(modPack, targetModPack, fileNames);
    }
    moveModPackFiles(targetModPack, fileNames) {
        let modPack = this._selectedModPack.value;
        return this._modsHubService.moveModPackFiles(modPack, targetModPack, fileNames);
    }
    downloadFromModPortal(fileNames) {
        return __awaiter(this, void 0, void 0, function* () {
            let modPack = this._selectedModPack.value;
            this._modsHubService.downloadFromModPortal(modPack, fileNames);
            this._downloading.raise(true);
        });
    }
    uploadFiles(files) {
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
ModsService.fileUploadUrl = '/admin/mods?handler=UploadFiles';
//# sourceMappingURL=modsService.js.map