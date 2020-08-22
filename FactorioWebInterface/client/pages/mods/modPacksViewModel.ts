import { ModsService } from "./modsService";
import { ModPackMetaData } from "../servers/serversTypes";
import { DelegateCommand, ICommand } from "../../utils/command";
import { IModalService } from "../../services/iModalService";
import { NewModPackViewModel } from "./newModPackViewModel";
import { ErrorService } from "../../services/errorService";
import { RenameModPackViewModel } from "./renameModPackViewModel";
import { DeleteModPackViewModel } from "./DeleteModPackViewModel";
import { CollectionView } from "../../utils/collections/module";

export class ModPacksViewModel {
    private _modsService: ModsService;
    private _modalService: IModalService;
    private _errorService: ErrorService;

    private _modPacks: CollectionView<ModPackMetaData>;

    private _newCommand: DelegateCommand;
    private _renameCommand: DelegateCommand<ModPackMetaData>;
    private _deleteCommand: DelegateCommand<ModPackMetaData>;

    get newCommand(): ICommand {
        return this._newCommand;
    }

    get renameCommand(): ICommand<ModPackMetaData> {
        return this._renameCommand;
    }

    get deleteCommand(): ICommand<ModPackMetaData> {
        return this._deleteCommand;
    }

    get modPacks(): CollectionView<ModPackMetaData> {
        return this._modPacks;
    }

    constructor(modsService: ModsService, modalService: IModalService, errorService: ErrorService) {
        this._modsService = modsService;
        this._modalService = modalService;
        this._errorService = errorService;

        this._modPacks = new CollectionView(modsService.modPacks);
        this._modPacks.sortBy({ property: 'LastModifiedTime', ascending: false });

        this._newCommand = new DelegateCommand(async () => {
            let vm = new NewModPackViewModel(this._modsService, this._errorService);
            await this._modalService.showViewModel(vm);
            vm.disconnect();
        });

        this._renameCommand = new DelegateCommand(async modPack => {
            let vm = new RenameModPackViewModel(modPack, this._modsService, this._errorService);
            await this._modalService.showViewModel(vm);
            vm.disconnect();
        });

        this._deleteCommand = new DelegateCommand(modPack => {
            let vm = new DeleteModPackViewModel(modPack, this._modsService, this._errorService);
            this._modalService.showViewModel(vm);
        });
    }

    setSelectModPack(modPack: ModPackMetaData): void {
        this._modsService.setSelectedModPack(modPack.Name);
    }
}