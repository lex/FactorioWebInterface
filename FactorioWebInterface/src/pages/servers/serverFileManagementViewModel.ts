import { ServerFileManagementService } from "./serverFileManagementService";
import { IObservableProperty } from "../../utils/observableProperty";
import { DelegateCommand, ICommand } from "../../utils/command";
import { FileSelectionService } from "../../services/fileSelectionservice";
import { FileViewModel } from "./fileViewModel";
import { FileMetaData } from "./serversTypes";
import { IterableHelper } from "../../utils/iterableHelper";
import { ErrorService } from "../../services/errorService";
import { ObservableObject } from "../../utils/observableObject";
import { ObservableKeyArray } from "../../utils/observableCollection";
import { CollectionView } from "../../utils/collectionView";
import { FileHelper } from "../../utils/fileHelper";

export interface Destination {
    path: string;
    name: string;
}

export class ServerFileManagementViewModel extends ObservableObject {
    static readonly uploadSavesTooltipEnabledMessage = 'Upload save files to Local Saves.';
    static readonly uploadSavesTooltipDisabledMessage = 'Wait for uploading to finish before uploading more saves.';
    static readonly deleteSavesTooltipDisabledMessage = 'Select saves to delete.';
    static readonly moveSavesTooltipDisabledMessage = 'Select saves to move to destination.';
    static readonly copySavesTooltipDisabledMessage = 'Select saves to copy to destination.';
    static readonly renameSaveTooltipDisableMessage = 'Select a single save and a new name to rename.';
    static readonly deflateSaveTooltipDisableMessage = 'Select a single save to deflate and optionally a new name.';
    static readonly deflateSaveTooltipInProgressDisableMessage = 'Wait for deflating to finish before defalting more saves.';

    private _serverFileManagementService: ServerFileManagementService;
    private _errorService: ErrorService;

    private _tempFiles: FileViewModel;
    private _localFiles: FileViewModel;
    private _globalFiles: FileViewModel;

    private _destinations: ObservableKeyArray<string, Destination>;
    private _destinationsCollectionView: CollectionView<Destination>;

    private _newFileName = '';

    private _uploadSavesTooltip: string = null;
    private _deleteSavesTooltip: string = null;
    private _moveSavesTooltip: string = null;
    private _copySavesTooltip: string = null;
    private _renameSavesTooltip: string = null;
    private _deflateSavesTooltip: string = null;

    private _uploadSavesCommand: DelegateCommand;
    private _deleteSavesCommand: DelegateCommand;
    private _moveSavesCommand: DelegateCommand;
    private _copySavesCommand: DelegateCommand;
    private _renameSaveCommand: DelegateCommand;
    private _deflateSaveCommand: DelegateCommand;

    get isUploading(): IObservableProperty<boolean> {
        return this._serverFileManagementService.uploading;
    }

    get uploadProgress(): IObservableProperty<number> {
        return this._serverFileManagementService.uploadProgress;
    }

    get isDeflating(): IObservableProperty<boolean> {
        return this._serverFileManagementService.deflating;
    }

    get destinationsCollectionView(): CollectionView<Destination> {
        return this._destinationsCollectionView;
    }

    get uploadSavesTooltip(): string {
        return this._uploadSavesTooltip;
    }
    set uploadSavesTooltip(value: string) {
        if (value === this._uploadSavesTooltip) {
            return;
        }

        this._uploadSavesTooltip = value;
        this.raise('uploadSavesTooltip', value);
    }

    get deleteSavesTooltip(): string {
        return this._deleteSavesTooltip;
    }
    set deleteSavesTooltip(value: string) {
        if (value === this._deleteSavesTooltip) {
            return;
        }

        this._deleteSavesTooltip = value;
        this.raise('deleteSavesTooltip', value);
    }

    get moveSavesTooltip(): string {
        return this._moveSavesTooltip;
    }
    set moveSavesTooltip(value: string) {
        if (value === this._moveSavesTooltip) {
            return;
        }

        this._moveSavesTooltip = value;
        this.raise('moveSavesTooltip', value);
    }

    get copySavesTooltip(): string {
        return this._copySavesTooltip;
    }
    set copySavesTooltip(value: string) {
        if (value === this._copySavesTooltip) {
            return;
        }

        this._copySavesTooltip = value;
        this.raise('copySavesTooltip', value);
    }

    get renameSavesTooltip(): string {
        return this._renameSavesTooltip;
    }
    set renameSavesTooltip(value: string) {
        if (value === this._renameSavesTooltip) {
            return;
        }

        this._renameSavesTooltip = value;
        this.raise('renameSavesTooltip', value);
    }

    get deflateSavesTooltip(): string {
        return this._deflateSavesTooltip;
    }
    set deflateSavesTooltip(value: string) {
        if (value === this._deflateSavesTooltip) {
            return;
        }

        this._deflateSavesTooltip = value;
        this.raise('deflateSavesTooltip', value);
    }

    get uploadSavesCommand(): ICommand {
        return this._uploadSavesCommand;
    }

    get deleteSavesCommand(): ICommand {
        return this._deleteSavesCommand;
    }

    get moveSavesCommand(): ICommand {
        return this._moveSavesCommand;
    }

    get copySavesCommand(): ICommand {
        return this._copySavesCommand;
    }

    get renameSaveCommand(): ICommand {
        return this._renameSaveCommand;
    }

    get deflateSaveCommand(): ICommand {
        return this._deflateSaveCommand;
    }

    get newFileName(): string {
        return this._newFileName;
    }

    set newFileName(value: string) {
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

    constructor(
        serverFileManagementService: ServerFileManagementService,
        fileSelectionService: FileSelectionService,
        errorService: ErrorService,
        tempFiles: FileViewModel,
        localFiles: FileViewModel,
        globalFiles: FileViewModel,
    ) {
        super();

        this._serverFileManagementService = serverFileManagementService;
        this._errorService = errorService;

        this._tempFiles = tempFiles;
        this._localFiles = localFiles;
        this._globalFiles = globalFiles;

        this._destinations = new ObservableKeyArray(destination => destination.path);

        this._destinations.add({ path: 'global_saves', name: 'Global' });

        for (let i = 1; i <= 10; i++) {
            let destination: Destination = { path: `${i}/local_saves`, name: `Local ${i}` };
            this._destinations.add(destination);
        }
        this._destinations.add(
            { path: 'public/start', name: 'Public Start' },
            { path: 'public/final', name: 'Public Final' },
            { path: 'public/old', name: 'Public Old' }
        );

        this._destinationsCollectionView = new CollectionView(this._destinations);
        this._destinationsCollectionView.setFirstSingleSelected();

        this._uploadSavesCommand = new DelegateCommand(async () => {
            let files = await fileSelectionService.getFiles('.zip');
            if (files.length === 0) {
                return;
            }

            let result = await this._serverFileManagementService.uploadFiles(files);
            this._errorService.reportIfError(result);
        },
            () => !this.isUploading.value);

        this._deleteSavesCommand = new DelegateCommand(async () => {
            let files = IterableHelper.map(this.getAllSelectedSaveFiles(), file => `${file.Directory}/${file.Name}`);

            let result = await this._serverFileManagementService.deleteFiles([...files]);
            this._errorService.reportIfError(result);
        },
            () => this.getSelectedSaveFileCount() > 0);

        this._moveSavesCommand = new DelegateCommand(async () => {
            let files = IterableHelper.map(this.getAllSelectedSaveFiles(), file => `${file.Directory}/${file.Name}`);

            let result = await this._serverFileManagementService.moveFiles(this.getSelectedDestinationPath(), [...files]);
            this._errorService.reportIfError(result);
        },
            () => this.getSelectedSaveFileCount() > 0);

        this._copySavesCommand = new DelegateCommand(async () => {
            let files = IterableHelper.map(this.getAllSelectedSaveFiles(), file => `${file.Directory}/${file.Name}`);

            let result = await this._serverFileManagementService.copyFiles(this.getSelectedDestinationPath(), [...files]);
            this._errorService.reportIfError(result);
        },
            () => this.getSelectedSaveFileCount() > 0);

        this._renameSaveCommand = new DelegateCommand(async () => {
            let file = this.getSelectedSaveFile();

            let result = await this._serverFileManagementService.renameFile(file.Directory, file.Name, this._newFileName)
            this._errorService.reportIfError(result);
        },
            () => this.newFileName && this.getSelectedSaveFileCount() === 1);

        this._deflateSaveCommand = new DelegateCommand(async () => {
            let file = this.getSelectedSaveFile();

            let result = await this._serverFileManagementService.deflateSave(file.Directory, file.Name, this._newFileName);
            this._errorService.reportIfError(result);
        },
            () => this.getSelectedSaveFileCount() === 1 && !this.isDeflating.value);

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

    private getSelectedSaveFileCount(): number {
        return this._tempFiles.files.selectedCount +
            this._localFiles.files.selectedCount +
            this._globalFiles.files.selectedCount;
    }

    private getSelectedSaveFile(): FileMetaData {
        return (IterableHelper.firstOrDefault(this._tempFiles.files.selected) ??
            IterableHelper.firstOrDefault(this._localFiles.files.selected) ??
            IterableHelper.firstOrDefault(this._globalFiles.files.selected)).value;
    }

    private getAllSelectedSaveFiles(): IterableIterator<FileMetaData> {
        let all = IterableHelper.combine(this._tempFiles.files.selected,
            this._localFiles.files.selected,
            this._globalFiles.files.selected);

        return IterableHelper.map(all, x => x.value);
    }

    private getSelectedDestinationPath(): string {
        return IterableHelper.firstOrDefault(this._destinationsCollectionView.selected)?.value.path;
    }

    private getSelectedDestinationName(): string {
        return IterableHelper.firstOrDefault(this._destinationsCollectionView.selected)?.value.name;
    }

    private updateUploadSavesTooltip(): void {
        if (this._uploadSavesCommand.canExecute()) {
            this.uploadSavesTooltip = ServerFileManagementViewModel.uploadSavesTooltipEnabledMessage;
        } else {
            this.uploadSavesTooltip = ServerFileManagementViewModel.uploadSavesTooltipDisabledMessage;
        }
    }

    private updateDeleteSavesTooltip(): void {
        if (this._deleteSavesCommand.canExecute()) {
            let count = this.getSelectedSaveFileCount();

            if (count === 1) {
                let save = IterableHelper.firstOrDefault(this.getAllSelectedSaveFiles());
                this.deleteSavesTooltip = `Delete the save ${FileMetaData.FriendlyDirectoryName(save)}/${save.Name}.`;
            } else {
                this.deleteSavesTooltip = `Delete ${count} selected saves.`;
            }

        } else {
            this.deleteSavesTooltip = ServerFileManagementViewModel.deleteSavesTooltipDisabledMessage;
        }
    }

    private updateMoveSavesTooltip(): void {
        if (this._moveSavesCommand.canExecute()) {
            let count = this.getSelectedSaveFileCount();

            if (count === 1) {
                let save = IterableHelper.firstOrDefault(this.getAllSelectedSaveFiles());
                this.moveSavesTooltip = `Move the save ${FileMetaData.FriendlyDirectoryName(save)}/${save.Name} to ${this.getSelectedDestinationName()}.`;
            } else {
                this.moveSavesTooltip = `Move ${count} selected saves to ${this.getSelectedDestinationName()}.`;
            }

        } else {
            this.moveSavesTooltip = ServerFileManagementViewModel.moveSavesTooltipDisabledMessage;
        }
    }

    private updateCopySavesTooltip(): void {
        if (this._copySavesCommand.canExecute()) {
            let count = this.getSelectedSaveFileCount();

            if (count === 1) {
                let save = IterableHelper.firstOrDefault(this.getAllSelectedSaveFiles());
                this.copySavesTooltip = `Copy the save ${FileMetaData.FriendlyDirectoryName(save)}/${save.Name} to ${this.getSelectedDestinationName()}.`;
            } else {
                this.copySavesTooltip = `Copy ${count} selected saves to ${this.getSelectedDestinationName()}.`;
            }
        } else {
            this.copySavesTooltip = ServerFileManagementViewModel.copySavesTooltipDisabledMessage;
        }
    }

    private updateRenameSavesTooltip(): void {
        if (this._renameSaveCommand.canExecute()) {
            let save = this.getSelectedSaveFile();
            let newName = FileHelper.enusreExtension(this.newFileName, '.zip');
            this.renameSavesTooltip = `Rename ${FileMetaData.FriendlyDirectoryName(save)}/${save.Name} to ${newName}.`;
        } else {
            this.renameSavesTooltip = ServerFileManagementViewModel.renameSaveTooltipDisableMessage;
        }
    }

    private updateDeflateSavesTooltip(): void {
        if (this.deflateSaveCommand.canExecute()) {
            let save = this.getSelectedSaveFile();
            let newName = this._newFileName;

            if (!newName) {
                newName = FileMetaData.defaltedName(save);
            } else {
                newName = FileHelper.enusreExtension(newName, '.zip');
            }

            this.deflateSavesTooltip = `Defalte ${FileMetaData.FriendlyDirectoryName(save)}/${save.Name} to ${newName}.`;
        } else {
            if (this.isDeflating.value) {
                this.deflateSavesTooltip = ServerFileManagementViewModel.deflateSaveTooltipInProgressDisableMessage;
            } else {
                this.deflateSavesTooltip = ServerFileManagementViewModel.deflateSaveTooltipDisableMessage;
            }
        }
    }
}