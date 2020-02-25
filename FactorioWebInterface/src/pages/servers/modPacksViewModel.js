import { CollectionView } from "../../utils/collectionView";
import { ObservableObject } from "../../utils/observableObject";
export class ModPacksViewModel extends ObservableObject {
    constructor(serverFileService) {
        super();
        let modPacks = serverFileService.modPacks;
        let selectedModPack = serverFileService.selectedModPack;
        this._sourceModPacks = modPacks;
        this._modPacks = new CollectionView(modPacks);
        this._modPacks.sortBy({ property: 'LastModifiedTime', ascending: false });
        this._modPacks.selectedChanged.subscribe(() => {
            let selectedModPack = [...this._modPacks.selected][0];
            let name;
            if (selectedModPack == null) {
                name = '';
            }
            else {
                name = selectedModPack.value.Name;
            }
            serverFileService.setSelectedModPack(name);
        });
        this.setSelectModPackByName(selectedModPack.value);
        selectedModPack.subscribe(modPack => this.setSelectModPackByName(modPack));
        this.updateHeader();
        this.modPacks.subscribe(() => this.updateHeader());
    }
    get header() {
        return this._header;
    }
    get modPacks() {
        return this._modPacks;
    }
    setSelectModPackByName(modPack) {
        let box = this._modPacks.getBoxByKey(modPack);
        if (box == null) {
            this._modPacks.unSelectAll();
            return;
        }
        this._modPacks.setSingleSelected(box);
    }
    updateHeader() {
        let newCount = this._sourceModPacks.count;
        if (this._count === newCount) {
            return;
        }
        this._count = newCount;
        this._header = `Mod Packs (${newCount})`;
        this.raise('header', this._header);
    }
}
//# sourceMappingURL=modPacksViewModel.js.map