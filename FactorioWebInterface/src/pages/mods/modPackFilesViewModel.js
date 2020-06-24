var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ObservableObject } from "../../utils/observableObject";
import { CollectionView, CollectionViewChangeType } from "../../utils/collectionView";
import { DelegateCommand } from "../../utils/command";
import { IterableHelper } from "../../utils/iterableHelper";
export class ModPackFilesViewModel extends ObservableObject {
    constructor(modsService, fileSelectionService, errorService) {
        super();
        this._title = ModPackFilesViewModel.defaultTitle;
        this._modsService = modsService;
        this._fileSelectionService = fileSelectionService;
        this._errorService = errorService;
        this._files = new CollectionView(modsService.selectedModPackFiles);
        this._files.sortBy({ property: 'Name' });
        this._modPacks = new CollectionView(modsService.modPacks);
        this._modPacks.bind(event => {
            if (event.type === CollectionViewChangeType.Reset) {
                this._modPacks.setFirstSingleSelected();
            }
        });
        this._uploadFilesCommand = new DelegateCommand(() => __awaiter(this, void 0, void 0, function* () {
            let files = yield this._fileSelectionService.getFiles('.zip,.json,.dat');
            if (files.length === 0) {
                return;
            }
            let result = yield this._modsService.uploadFiles(files);
            this._errorService.reportIfError(result);
        }), () => this.isModPackSelected && !this.isUploading.value);
        this._downloadFilesCommand = new DelegateCommand(() => __awaiter(this, void 0, void 0, function* () {
            let files = yield this._fileSelectionService.getFiles('.zip');
            if (files.length === 0) {
                return;
            }
            this._modsService.downloadFromModPortal(files.map(f => f.name));
        }), () => this.isModPackSelected && !this.isDownloading.value);
        this._deleteFilesCommand = new DelegateCommand(() => __awaiter(this, void 0, void 0, function* () {
            let fileNames = IterableHelper.map(this._files.selected, f => f.value.Name);
            let result = yield this._modsService.deleteModPackFiles([...fileNames]);
            this._errorService.reportIfError(result);
        }), () => this.isModPackSelected && this._files.selectedCount > 0);
        this._copyFilesCommand = new DelegateCommand(() => __awaiter(this, void 0, void 0, function* () {
            let targetModPack = IterableHelper.firstOrDefault(this._modPacks.selected).value.Name;
            let fileNames = IterableHelper.map(this._files.selected, f => f.value.Name);
            let result = yield this._modsService.copyModPackFiles(targetModPack, [...fileNames]);
            this._errorService.reportIfError(result);
        }), () => this.isModPackSelected && this._files.selectedCount > 0 && this._modPacks.selectedCount === 1);
        this._moveFilesCommand = new DelegateCommand(() => __awaiter(this, void 0, void 0, function* () {
            let targetModPack = IterableHelper.firstOrDefault(this._modPacks.selected).value.Name;
            let fileNames = IterableHelper.map(this._files.selected, f => f.value.Name);
            let result = yield this._modsService.moveModPackFiles(targetModPack, [...fileNames]);
            this._errorService.reportIfError(result);
        }), () => this.isModPackSelected && this._files.selectedCount > 0 && this._modPacks.selectedCount === 1);
        modsService.selectedModPack.bind(event => {
            this.title = event ? event : ModPackFilesViewModel.defaultTitle;
            this.raise('selectedModPack', this.selectedModPack);
            this.raise('isModPackSelected', this.isModPackSelected);
            this._uploadFilesCommand.raiseCanExecuteChanged();
            this._downloadFilesCommand.raiseCanExecuteChanged();
            this._deleteFilesCommand.raiseCanExecuteChanged();
            this._copyFilesCommand.raiseCanExecuteChanged();
            this._moveFilesCommand.raiseCanExecuteChanged();
        });
        modsService.onEndDownloadResult.subscribe(event => this._errorService.reportIfError(event));
        this.isUploading.subscribe(event => this._uploadFilesCommand.raiseCanExecuteChanged());
        this.isDownloading.subscribe(event => this._downloadFilesCommand.raiseCanExecuteChanged());
        this._files.selectedChanged.subscribe(() => {
            this._deleteFilesCommand.raiseCanExecuteChanged();
            this._copyFilesCommand.raiseCanExecuteChanged();
            this._moveFilesCommand.raiseCanExecuteChanged();
        });
        this._modPacks.selectedChanged.subscribe(() => {
            this._copyFilesCommand.raiseCanExecuteChanged();
            this._moveFilesCommand.raiseCanExecuteChanged();
        });
    }
    get files() {
        return this._files;
    }
    get modPacks() {
        return this._modPacks;
    }
    get title() {
        return this._title;
    }
    set title(value) {
        if (this._title === value) {
            return;
        }
        this._title = value;
        this.raise('title', value);
    }
    get isUploading() {
        return this._modsService.uploading;
    }
    get uploadProgress() {
        return this._modsService.uploadProgress;
    }
    get isDownloading() {
        return this._modsService.downloading;
    }
    get uploadFilesCommand() {
        return this._uploadFilesCommand;
    }
    get downloadFilesCommand() {
        return this._downloadFilesCommand;
    }
    get deleteFilesCommand() {
        return this._deleteFilesCommand;
    }
    get copyFilesCommand() {
        return this._copyFilesCommand;
    }
    get moveFilesCommand() {
        return this._moveFilesCommand;
    }
    get selectedModPack() {
        return this._modsService.selectedModPack.value;
    }
    get isModPackSelected() {
        return !!this.selectedModPack;
    }
}
ModPackFilesViewModel.defaultTitle = 'No Mod Pack selected.';
//# sourceMappingURL=modPackFilesViewModel.js.map