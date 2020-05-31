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

export interface Destination {
    path: string;
    name: string;
}

export class ServerFileManagementViewModel extends ObservableObject {
    private _serverFileManagementService: ServerFileManagementService;
    private _errorService: ErrorService;

    private _tempFiles: FileViewModel;
    private _localFiles: FileViewModel;
    private _globalFiles: FileViewModel;

    private _destinations: ObservableKeyArray<string, Destination>;
    private _destinationsCollectionView: CollectionView<Destination>;

    private _newFileName = '';

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
        if (this._newFileName === value) {
            return;
        }

        this._newFileName = value;
        this.raise('newFileName', value)
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
        let first = IterableHelper.firstOrDefault(this.destinationsCollectionView.values);
        this._destinationsCollectionView.setSingleSelected(first);

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
            () => this.getSaveFileSelectedCount() > 0);

        this._moveSavesCommand = new DelegateCommand(async () => {
            let files = IterableHelper.map(this.getAllSelectedSaveFiles(), file => `${file.Directory}/${file.Name}`);

            let result = await this._serverFileManagementService.moveFiles(this.getSelectedDestination(), [...files]);
            this._errorService.reportIfError(result);
        },
            () => this.getSaveFileSelectedCount() > 0);

        this._copySavesCommand = new DelegateCommand(async () => {
            let files = IterableHelper.map(this.getAllSelectedSaveFiles(), file => `${file.Directory}/${file.Name}`);

            let result = await this._serverFileManagementService.copyFiles(this.getSelectedDestination(), [...files]);
            this._errorService.reportIfError(result);
        },
            () => this.getSaveFileSelectedCount() > 0);

        this._renameSaveCommand = new DelegateCommand(async () => {
            let file = this.getSelectedSaveFile();

            let result = await this._serverFileManagementService.renameFile(file.Directory, file.Name, this._newFileName)
            this._errorService.reportIfError(result);
        },
            () => this.getSaveFileSelectedCount() === 1);

        this._deflateSaveCommand = new DelegateCommand(async () => {
            let file = this.getSelectedSaveFile();

            let result = await this._serverFileManagementService.deflateSave(file.Directory, file.Name, this._newFileName);
            this._errorService.reportIfError(result);
        },
            () => this.getSaveFileSelectedCount() === 1 && !this.isDeflating.value);


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

    private getSaveFileSelectedCount(): number {
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

    private getSelectedDestination(): string {
        return IterableHelper.firstOrDefault(this._destinationsCollectionView.selected)?.value.path;
    }
}