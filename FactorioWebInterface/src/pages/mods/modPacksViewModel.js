var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
        this._newCommand = new DelegateCommand(() => __awaiter(this, void 0, void 0, function* () {
            let vm = new NewModPackViewModel(this._modsService, this._errorService);
            yield this._modalService.showViewModel(vm);
            vm.disconnect();
        }));
        this._renameCommand = new DelegateCommand((modPack) => __awaiter(this, void 0, void 0, function* () {
            let vm = new RenameModPackViewModel(modPack, this._modsService, this._errorService);
            yield this._modalService.showViewModel(vm);
            vm.disconnect();
        }));
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
    setSelectModPack(modPack) {
        this._modsService.setSelectedModPack(modPack.Name);
    }
}
//# sourceMappingURL=modPacksViewModel.js.map