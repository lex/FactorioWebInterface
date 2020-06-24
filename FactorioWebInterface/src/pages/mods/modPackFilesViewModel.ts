import { ObservableObject } from "../../utils/observableObject";
import { CollectionView, CollectionViewChangeType } from "../../utils/collectionView";
import { ModPackFileMetaData, ModPackMetaData } from "../servers/serversTypes";
import { ModsService } from "./modsService";
import { DelegateCommand, ICommand } from "../../utils/command";
import { FileSelectionService } from "../../services/fileSelectionservice";
import { IObservableProperty } from "../../utils/observableProperty";
import { ErrorService } from "../../services/errorService";
import { IterableHelper } from "../../utils/iterableHelper";

export class ModPackFilesViewModel extends ObservableObject<ModPackFilesViewModel>{
    static readonly defaultTitle = 'No Mod Pack selected.';

    private _modsService: ModsService;
    private _fileSelectionService: FileSelectionService;
    private _errorService: ErrorService;

    private _files: CollectionView<ModPackFileMetaData>;
    private _modPacks: CollectionView<ModPackMetaData>;

    private _title = ModPackFilesViewModel.defaultTitle;

    private _uploadFilesCommand: DelegateCommand;
    private _downloadFilesCommand: DelegateCommand;
    private _deleteFilesCommand: DelegateCommand;
    private _copyFilesCommand: DelegateCommand;
    private _moveFilesCommand: DelegateCommand;

    get files(): CollectionView<ModPackFileMetaData> {
        return this._files;
    }

    get modPacks(): CollectionView<ModPackMetaData> {
        return this._modPacks;
    }

    get title(): string {
        return this._title;
    }
    set title(value: string) {
        if (this._title === value) {
            return;
        }

        this._title = value;
        this.raise('title', value);
    }

    get isUploading(): IObservableProperty<boolean> {
        return this._modsService.uploading;
    }

    get uploadProgress(): IObservableProperty<number> {
        return this._modsService.uploadProgress;
    }

    get isDownloading(): IObservableProperty<boolean> {
        return this._modsService.downloading;
    }

    get uploadFilesCommand(): ICommand {
        return this._uploadFilesCommand;
    }

    get downloadFilesCommand(): ICommand {
        return this._downloadFilesCommand;
    }

    get deleteFilesCommand(): ICommand {
        return this._deleteFilesCommand;
    }

    get copyFilesCommand(): ICommand {
        return this._copyFilesCommand;
    }

    get moveFilesCommand(): ICommand {
        return this._moveFilesCommand;
    }

    get selectedModPack(): string {
        return this._modsService.selectedModPack.value;
    }

    get isModPackSelected(): boolean {
        return !!this.selectedModPack;
    }

    constructor(modsService: ModsService, fileSelectionService: FileSelectionService, errorService: ErrorService) {
        super();

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

        this._uploadFilesCommand = new DelegateCommand(async () => {
            let files = await this._fileSelectionService.getFiles('.zip,.json,.dat');
            if (files.length === 0) {
                return;
            }

            let result = await this._modsService.uploadFiles(files);
            this._errorService.reportIfError(result);
        },
            () => this.isModPackSelected && !this.isUploading.value);

        this._downloadFilesCommand = new DelegateCommand(async () => {
            let files = await this._fileSelectionService.getFiles('.zip');
            if (files.length === 0) {
                return;
            }

            this._modsService.downloadFromModPortal(files.map(f => f.name));
        },
            () => this.isModPackSelected && !this.isDownloading.value);

        this._deleteFilesCommand = new DelegateCommand(async () => {
            let fileNames = IterableHelper.map(this._files.selected, f => f.value.Name);
            let result = await this._modsService.deleteModPackFiles([...fileNames]);

            this._errorService.reportIfError(result);
        },
            () => this.isModPackSelected && this._files.selectedCount > 0);

        this._copyFilesCommand = new DelegateCommand(async () => {
            let targetModPack = IterableHelper.firstOrDefault(this._modPacks.selected).value.Name;
            let fileNames = IterableHelper.map(this._files.selected, f => f.value.Name);
            let result = await this._modsService.copyModPackFiles(targetModPack, [...fileNames]);

            this._errorService.reportIfError(result);
        },
            () => this.isModPackSelected && this._files.selectedCount > 0 && this._modPacks.selectedCount === 1);

        this._moveFilesCommand = new DelegateCommand(async () => {
            let targetModPack = IterableHelper.firstOrDefault(this._modPacks.selected).value.Name;
            let fileNames = IterableHelper.map(this._files.selected, f => f.value.Name);
            let result = await this._modsService.moveModPackFiles(targetModPack, [...fileNames]);

            this._errorService.reportIfError(result);
        },
            () => this.isModPackSelected && this._files.selectedCount > 0 && this._modPacks.selectedCount === 1);

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
}