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
import { FileMetaData } from "./serversTypes";
import { IterableHelper } from "../../utils/iterableHelper";
import { ObservableObject } from "../../utils/observableObject";
import { ObservableKeyArray } from "../../utils/observableCollection";
import { CollectionView } from "../../utils/collectionView";
import { FileHelper } from "../../utils/fileHelper";
export class ServerFileManagementViewModel extends ObservableObject {
    constructor(serverFileManagementService, fileSelectionService, errorService, tempFiles, localFiles, globalFiles) {
        super();
        this._newFileName = '';
        this._uploadSavesTooltip = null;
        this._deleteSavesTooltip = null;
        this._moveSavesTooltip = null;
        this._copySavesTooltip = null;
        this._renameSavesTooltip = null;
        this._deflateSavesTooltip = null;
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
        this._destinationsCollectionView.setFirstSingleSelected();
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
        }), () => this.getSelectedSaveFileCount() > 0);
        this._moveSavesCommand = new DelegateCommand(() => __awaiter(this, void 0, void 0, function* () {
            let files = IterableHelper.map(this.getAllSelectedSaveFiles(), file => `${file.Directory}/${file.Name}`);
            let result = yield this._serverFileManagementService.moveFiles(this.getSelectedDestinationPath(), [...files]);
            this._errorService.reportIfError(result);
        }), () => this.getSelectedSaveFileCount() > 0);
        this._copySavesCommand = new DelegateCommand(() => __awaiter(this, void 0, void 0, function* () {
            let files = IterableHelper.map(this.getAllSelectedSaveFiles(), file => `${file.Directory}/${file.Name}`);
            let result = yield this._serverFileManagementService.copyFiles(this.getSelectedDestinationPath(), [...files]);
            this._errorService.reportIfError(result);
        }), () => this.getSelectedSaveFileCount() > 0);
        this._renameSaveCommand = new DelegateCommand(() => __awaiter(this, void 0, void 0, function* () {
            let file = this.getSelectedSaveFile();
            let result = yield this._serverFileManagementService.renameFile(file.Directory, file.Name, this._newFileName);
            this._errorService.reportIfError(result);
        }), () => this.newFileName && this.getSelectedSaveFileCount() === 1);
        this._deflateSaveCommand = new DelegateCommand(() => __awaiter(this, void 0, void 0, function* () {
            let file = this.getSelectedSaveFile();
            let result = yield this._serverFileManagementService.deflateSave(file.Directory, file.Name, this._newFileName);
            this._errorService.reportIfError(result);
        }), () => this.getSelectedSaveFileCount() === 1 && !this.isDeflating.value);
        this.updateUploadSavesTooltip();
        this.updateDeleteSavesTooltip();
        this.updateMoveSavesTooltip();
        this.updateCopySavesTooltip();
        this.updateRenameSavesTooltip();
        this.updateDeflateSavesTooltip();
        this._serverFileManagementService.uploading.subscribe(() => {
            this._uploadSavesCommand.raiseCanExecuteChanged();
            this.updateUploadSavesTooltip();
        });
        this._serverFileManagementService.deflating.subscribe(() => {
            this._deflateSaveCommand.raiseCanExecuteChanged();
            this.updateDeflateSavesTooltip();
        });
        let updateCanExecuteCommands = (() => {
            this._deleteSavesCommand.raiseCanExecuteChanged();
            this._moveSavesCommand.raiseCanExecuteChanged();
            this._copySavesCommand.raiseCanExecuteChanged();
            this._renameSaveCommand.raiseCanExecuteChanged();
            this._deflateSaveCommand.raiseCanExecuteChanged();
            this.updateDeleteSavesTooltip();
            this.updateMoveSavesTooltip();
            this.updateCopySavesTooltip();
            this.updateRenameSavesTooltip();
            this.updateDeflateSavesTooltip();
        });
        tempFiles.files.selectedChanged.subscribe(updateCanExecuteCommands);
        localFiles.files.selectedChanged.subscribe(updateCanExecuteCommands);
        globalFiles.files.selectedChanged.subscribe(updateCanExecuteCommands);
        this._destinationsCollectionView.selectedChanged.subscribe(() => {
            this.updateMoveSavesTooltip();
            this.updateCopySavesTooltip();
        });
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
    get uploadSavesTooltip() {
        return this._uploadSavesTooltip;
    }
    set uploadSavesTooltip(value) {
        if (value === this._uploadSavesTooltip) {
            return;
        }
        this._uploadSavesTooltip = value;
        this.raise('uploadSavesTooltip', value);
    }
    get deleteSavesTooltip() {
        return this._deleteSavesTooltip;
    }
    set deleteSavesTooltip(value) {
        if (value === this._deleteSavesTooltip) {
            return;
        }
        this._deleteSavesTooltip = value;
        this.raise('deleteSavesTooltip', value);
    }
    get moveSavesTooltip() {
        return this._moveSavesTooltip;
    }
    set moveSavesTooltip(value) {
        if (value === this._moveSavesTooltip) {
            return;
        }
        this._moveSavesTooltip = value;
        this.raise('moveSavesTooltip', value);
    }
    get copySavesTooltip() {
        return this._copySavesTooltip;
    }
    set copySavesTooltip(value) {
        if (value === this._copySavesTooltip) {
            return;
        }
        this._copySavesTooltip = value;
        this.raise('copySavesTooltip', value);
    }
    get renameSavesTooltip() {
        return this._renameSavesTooltip;
    }
    set renameSavesTooltip(value) {
        if (value === this._renameSavesTooltip) {
            return;
        }
        this._renameSavesTooltip = value;
        this.raise('renameSavesTooltip', value);
    }
    get deflateSavesTooltip() {
        return this._deflateSavesTooltip;
    }
    set deflateSavesTooltip(value) {
        if (value === this._deflateSavesTooltip) {
            return;
        }
        this._deflateSavesTooltip = value;
        this.raise('deflateSavesTooltip', value);
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
        value = value.trim();
        if (this._newFileName === value) {
            return;
        }
        this._newFileName = value;
        this.raise('newFileName', value);
        this._renameSaveCommand.raiseCanExecuteChanged();
        this.updateRenameSavesTooltip();
        this.updateDeflateSavesTooltip();
    }
    getSelectedSaveFileCount() {
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
    getSelectedDestinationPath() {
        var _a;
        return (_a = IterableHelper.firstOrDefault(this._destinationsCollectionView.selected)) === null || _a === void 0 ? void 0 : _a.value.path;
    }
    getSelectedDestinationName() {
        var _a;
        return (_a = IterableHelper.firstOrDefault(this._destinationsCollectionView.selected)) === null || _a === void 0 ? void 0 : _a.value.name;
    }
    updateUploadSavesTooltip() {
        if (this._uploadSavesCommand.canExecute()) {
            this.uploadSavesTooltip = ServerFileManagementViewModel.uploadSavesTooltipEnabledMessage;
        }
        else {
            this.uploadSavesTooltip = ServerFileManagementViewModel.uploadSavesTooltipDisabledMessage;
        }
    }
    updateDeleteSavesTooltip() {
        if (this._deleteSavesCommand.canExecute()) {
            let count = this.getSelectedSaveFileCount();
            if (count === 1) {
                let save = IterableHelper.firstOrDefault(this.getAllSelectedSaveFiles());
                this.deleteSavesTooltip = `Delete the save ${FileMetaData.FriendlyDirectoryName(save)}/${save.Name}.`;
            }
            else {
                this.deleteSavesTooltip = `Delete ${count} selected saves.`;
            }
        }
        else {
            this.deleteSavesTooltip = ServerFileManagementViewModel.deleteSavesTooltipDisabledMessage;
        }
    }
    updateMoveSavesTooltip() {
        if (this._moveSavesCommand.canExecute()) {
            let count = this.getSelectedSaveFileCount();
            if (count === 1) {
                let save = IterableHelper.firstOrDefault(this.getAllSelectedSaveFiles());
                this.moveSavesTooltip = `Move the save ${FileMetaData.FriendlyDirectoryName(save)}/${save.Name} to ${this.getSelectedDestinationName()}.`;
            }
            else {
                this.moveSavesTooltip = `Move ${count} selected saves to ${this.getSelectedDestinationName()}.`;
            }
        }
        else {
            this.moveSavesTooltip = ServerFileManagementViewModel.moveSavesTooltipDisabledMessage;
        }
    }
    updateCopySavesTooltip() {
        if (this._copySavesCommand.canExecute()) {
            let count = this.getSelectedSaveFileCount();
            if (count === 1) {
                let save = IterableHelper.firstOrDefault(this.getAllSelectedSaveFiles());
                this.copySavesTooltip = `Copy the save ${FileMetaData.FriendlyDirectoryName(save)}/${save.Name} to ${this.getSelectedDestinationName()}.`;
            }
            else {
                this.copySavesTooltip = `Copy ${count} selected saves to ${this.getSelectedDestinationName()}.`;
            }
        }
        else {
            this.copySavesTooltip = ServerFileManagementViewModel.copySavesTooltipDisabledMessage;
        }
    }
    updateRenameSavesTooltip() {
        if (this._renameSaveCommand.canExecute()) {
            let save = this.getSelectedSaveFile();
            let newName = FileHelper.enusreExtension(this.newFileName, '.zip');
            this.renameSavesTooltip = `Rename ${FileMetaData.FriendlyDirectoryName(save)}/${save.Name} to ${newName}.`;
        }
        else {
            this.renameSavesTooltip = ServerFileManagementViewModel.renameSaveTooltipDisableMessage;
        }
    }
    updateDeflateSavesTooltip() {
        if (this.deflateSaveCommand.canExecute()) {
            let save = this.getSelectedSaveFile();
            let newName = this._newFileName;
            if (!newName) {
                newName = FileMetaData.defaltedName(save);
            }
            else {
                newName = FileHelper.enusreExtension(newName, '.zip');
            }
            this.deflateSavesTooltip = `Defalte ${FileMetaData.FriendlyDirectoryName(save)}/${save.Name} to ${newName}.`;
        }
        else {
            if (this.isDeflating.value) {
                this.deflateSavesTooltip = ServerFileManagementViewModel.deflateSaveTooltipInProgressDisableMessage;
            }
            else {
                this.deflateSavesTooltip = ServerFileManagementViewModel.deflateSaveTooltipDisableMessage;
            }
        }
    }
}
ServerFileManagementViewModel.uploadSavesTooltipEnabledMessage = 'Upload save files to Local Saves.';
ServerFileManagementViewModel.uploadSavesTooltipDisabledMessage = 'Wait for uploading to finish before uploading more saves.';
ServerFileManagementViewModel.deleteSavesTooltipDisabledMessage = 'Select saves to delete.';
ServerFileManagementViewModel.moveSavesTooltipDisabledMessage = 'Select saves to move to destination.';
ServerFileManagementViewModel.copySavesTooltipDisabledMessage = 'Select saves to copy to destination.';
ServerFileManagementViewModel.renameSaveTooltipDisableMessage = 'Select a single save and a new name to rename.';
ServerFileManagementViewModel.deflateSaveTooltipDisableMessage = 'Select a single save to deflate and optionally a new name.';
ServerFileManagementViewModel.deflateSaveTooltipInProgressDisableMessage = 'Wait for deflating to finish before defalting more saves.';
//# sourceMappingURL=serverFileManagementViewModel.js.map