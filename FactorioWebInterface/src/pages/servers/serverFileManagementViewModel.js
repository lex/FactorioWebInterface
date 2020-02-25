var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { DelegateCommand } from "../../utils/command";
import { IterableHelper } from "../../utils/iterableHelper";
import { ObservableObject } from "../../utils/observableObject";
import { ObservableKeyArray } from "../../utils/observableCollection";
import { CollectionView } from "../../utils/collectionView";
export class ServerFileManagementViewModel extends ObservableObject {
    constructor(serverFileManagementService, fileSelectionService, errorService, tempFiles, localFiles, globalFiles) {
        super();
        this._newFileName = '';
        this._serverFileManagementService = serverFileManagementService;
        this._errorService = errorService;
        this._tempFiles = tempFiles;
        this._localFiles = localFiles;
        this._globalFiles = globalFiles;
        this._destinations = new ObservableKeyArray(destination => destination.path);
        this._destinations.add({ path: 'global_saves', name: 'Global' });
        for (let i = 1; i <= 10; i++) {
            let destination = { path: `${i}/local_saves`, name: `Local ${i}` };
            this._destinations.add(destination);
        }
        this._destinations.add({ path: 'public/start', name: 'Public Start' }, { path: 'public/final', name: 'Public Final' }, { path: 'public/old', name: 'Public Old' });
        this._destinationsCollectionView = new CollectionView(this._destinations);
        let first = IterableHelper.firstOrDefault(this.destinationsCollectionView.values);
        this._destinationsCollectionView.setSingleSelected(first);
        this._uploadSavesCommand = new DelegateCommand(() => __awaiter(this, void 0, void 0, function* () {
            let files = yield fileSelectionService.getFiles('.zip');
            if (files.length === 0) {
                return;
            }
            let result = yield this._serverFileManagementService.uploadFiles(files);
            this._errorService.reportIfError(result);
        }), () => !this.isUploading.value);
        this._deleteSavesCommand = new DelegateCommand(() => __awaiter(this, void 0, void 0, function* () {
            let files = IterableHelper.map(this.getAllSelectedSaveFiles(), file => `${file.Directory}/${file.Name}`);
            let result = yield this._serverFileManagementService.deleteFiles([...files]);
            this._errorService.reportIfError(result);
        }), () => this.getSaveFileSelectedCount() > 0);
        this._moveSavesCommand = new DelegateCommand(() => __awaiter(this, void 0, void 0, function* () {
            let files = IterableHelper.map(this.getAllSelectedSaveFiles(), file => `${file.Directory}/${file.Name}`);
            let result = yield this._serverFileManagementService.moveFiles(this.getSelectedDestination(), [...files]);
            this._errorService.reportIfError(result);
        }), () => this.getSaveFileSelectedCount() > 0);
        this._copySavesCommand = new DelegateCommand(() => __awaiter(this, void 0, void 0, function* () {
            let files = IterableHelper.map(this.getAllSelectedSaveFiles(), file => `${file.Directory}/${file.Name}`);
            let result = yield this._serverFileManagementService.copyFiles(this.getSelectedDestination(), [...files]);
            this._errorService.reportIfError(result);
        }), () => this.getSaveFileSelectedCount() > 0);
        this._renameSaveCommand = new DelegateCommand(() => __awaiter(this, void 0, void 0, function* () {
            let file = this.getSelectedSaveFile();
            let result = yield this._serverFileManagementService.renameFile(file.Directory, file.Name, this._newFileName);
            this._errorService.reportIfError(result);
        }), () => this.getSaveFileSelectedCount() === 1);
        this._deflateSaveCommand = new DelegateCommand(() => __awaiter(this, void 0, void 0, function* () {
            let file = this.getSelectedSaveFile();
            let result = yield this._serverFileManagementService.deflateSave(file.Directory, file.Name, this._newFileName);
            this._errorService.reportIfError(result);
        }), () => this.getSaveFileSelectedCount() === 1 && !this.isDeflating.value);
        this._serverFileManagementService.uploading.subscribe(() => this._uploadSavesCommand.raiseCanExecuteChanged());
        this._serverFileManagementService.deflating.subscribe(() => this._deflateSaveCommand.raiseCanExecuteChanged());
        let updateCanExecuteCommands = (() => {
            this._deleteSavesCommand.raiseCanExecuteChanged();
            this._moveSavesCommand.raiseCanExecuteChanged();
            this._copySavesCommand.raiseCanExecuteChanged();
            this._renameSaveCommand.raiseCanExecuteChanged();
            this._deflateSaveCommand.raiseCanExecuteChanged();
        });
        tempFiles.files.selectedChanged.subscribe(updateCanExecuteCommands);
        localFiles.files.selectedChanged.subscribe(updateCanExecuteCommands);
        globalFiles.files.selectedChanged.subscribe(updateCanExecuteCommands);
    }
    get isUploading() {
        return this._serverFileManagementService.uploading;
    }
    get uploadProgress() {
        return this._serverFileManagementService.uploadProgress;
    }
    get isDeflating() {
        return this._serverFileManagementService.deflating;
    }
    get destinationsCollectionView() {
        return this._destinationsCollectionView;
    }
    get uploadSavesCommand() {
        return this._uploadSavesCommand;
    }
    get deleteSavesCommand() {
        return this._deleteSavesCommand;
    }
    get moveSavesCommand() {
        return this._moveSavesCommand;
    }
    get copySavesCommand() {
        return this._copySavesCommand;
    }
    get renameSaveCommand() {
        return this._renameSaveCommand;
    }
    get deflateSaveCommand() {
        return this._deflateSaveCommand;
    }
    get newFileName() {
        return this._newFileName;
    }
    set newFileName(value) {
        if (this._newFileName === value) {
            return;
        }
        this._newFileName = value;
        this.raise('newFileName', value);
    }
    getSaveFileSelectedCount() {
        return this._tempFiles.files.selectedCount +
            this._localFiles.files.selectedCount +
            this._globalFiles.files.selectedCount;
    }
    getSelectedSaveFile() {
        var _a, _b;
        return ((_b = (_a = IterableHelper.firstOrDefault(this._tempFiles.files.selected)) !== null && _a !== void 0 ? _a : IterableHelper.firstOrDefault(this._localFiles.files.selected)) !== null && _b !== void 0 ? _b : IterableHelper.firstOrDefault(this._globalFiles.files.selected)).value;
    }
    getAllSelectedSaveFiles() {
        let all = IterableHelper.combine(this._tempFiles.files.selected, this._localFiles.files.selected, this._globalFiles.files.selected);
        return IterableHelper.map(all, x => x.value);
    }
    getSelectedDestination() {
        var _a;
        return (_a = IterableHelper.firstOrDefault(this._destinationsCollectionView.selected)) === null || _a === void 0 ? void 0 : _a.value.path;
    }
}
//# sourceMappingURL=serverFileManagementViewModel.js.map