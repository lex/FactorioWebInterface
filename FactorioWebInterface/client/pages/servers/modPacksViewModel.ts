import { ModPackMetaData } from "./serversTypes";
import { ObservableObject } from "../../utils/observableObject";
import { ServerFileService } from "./serverFileService";
import { ObservableCollection, CollectionView } from "../../utils/collections/module";

export class ModPacksViewModel extends ObservableObject {
    private _sourceModPacks: ObservableCollection<ModPackMetaData>;
    private _count: number;

    private _header: string;
    private _modPacks: CollectionView<ModPackMetaData>;

    get header() {
        return this._header;
    }

    get modPacks() {
        return this._modPacks;
    }

    constructor(serverFileService: ServerFileService) {
        super();

        let modPacks = serverFileService.modPacks;
        let selectedModPack = serverFileService.selectedModPack;

        this._sourceModPacks = modPacks;
        this._modPacks = new CollectionView(modPacks);
        this._modPacks.sortBy({ property: 'LastModifiedTime', ascending: false });
        this._modPacks.selectedChanged.subscribe(() => {
            let selectedModPack = [...this._modPacks.selected][0];
            let name: string;
            if (selectedModPack == null) {
                name = '';
            } else {
                name = selectedModPack.value.Name;
            }

            serverFileService.setSelectedModPack(name);
        });

        this.setSelectModPackByName(selectedModPack.value);
        selectedModPack.subscribe(modPack => this.setSelectModPackByName(modPack));

        this.updateHeader();
        this.modPacks.subscribe(() => this.updateHeader());
    }

    private setSelectModPackByName(modPack: string) {
        let box = this._modPacks.getBoxByKey(modPack);

        if (box == null) {
            this._modPacks.unSelectAll();
            return;
        }

        this._modPacks.setSingleSelected(box);
    }

    private updateHeader() {
        let newCount = this._sourceModPacks.count;

        if (this._count === newCount) {
            return;
        }

        this._count = newCount;

        this._header = `Mod Packs (${newCount})`;
        this.raise('header', this._header);
    }
}