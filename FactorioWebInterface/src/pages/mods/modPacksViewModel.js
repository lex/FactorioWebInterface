import { CollectionView } from "../../utils/collectionView";
import { DelegateCommand } from "../../utils/command";
import { NewModPackViewModel } from "./newModPackViewModel";
import { RenameModPackViewModel } from "./renameModPackViewModel";
import { DeleteModPackViewModel } from "./DeleteModPackViewModel";
export class ModPacksViewModel {
    constructor(modsService, modalService, errorService) {
        this._modsService = modsService;
        this._modalService = modalService;
        this._errorService = errorService;
        this._modPacks = new CollectionView(modsService.modPacks);
        this._modPacks.sortBy({ property: 'LastModifiedTime', ascending: false });
        this._newCommand = new DelegateCommand(() => {
            let vm = new NewModPackViewModel(this._modsService, this._errorService);
            this._modalService.showViewModel(vm);
        });
        this._renameCommand = new DelegateCommand(modPack => {
            let vm = new RenameModPackViewModel(modPack, this._modsService, this._errorService);
            this._modalService.showViewModel(vm);
        });
        this._deleteCommand = new DelegateCommand(modPack => {
            let vm = new DeleteModPackViewModel(modPack, this._modsService, this._errorService);
            this._modalService.showViewModel(vm);
        });
    }
    get newCommand() {
        return this._newCommand;
    }
    get renameCommand() {
        return this._renameCommand;
    }
    get deleteCommand() {
        return this._deleteCommand;
    }
    get modPacks() {
        return this._modPacks;
    }
}
//# sourceMappingURL=modPacksViewModel.js.map