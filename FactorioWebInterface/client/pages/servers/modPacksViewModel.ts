import { ModPackMetaData } from "./serversTypes";
import { ObservableObject } from "../../utils/observableObject";
import { ServerFileService } from "./serverFileService";
import { ObservableCollection, CollectionView } from "../../utils/collections/module";
import { IterableHelper } from "../../utils/iterableHelper";
import { CollectionChangeType } from "../../ts/utils";

export class ModPacksViewModel extends ObservableObject {
    private _sourceModPacks: ObservableCollection<ModPackMetaData>;

    private _header: string;
    private _modPacks: CollectionView<string, ModPackMetaData>;

    get header(): string {
        return this._header;
    }

    get modPacks(): CollectionView<string, ModPackMetaData> {
        return this._modPacks;
    }

    get count(): number {
        return this._sourceModPacks.count;
    }

    constructor(serverFileService: ServerFileService) {
        super();

        let modPacks = serverFileService.modPacks;
        let selectedModPack = serverFileService.selectedModPack;

        this._sourceModPacks = modPacks;
        this._modPacks = new CollectionView(modPacks);
        this._modPacks.sortBy({ property: 'LastModifiedTime', ascending: false });
        this._modPacks.newSingleSelectedChanged.subscribe(() => {
            let name = IterableHelper.firstOrDefault(this._modPacks.selected)?.Name ?? '';
            serverFileService.setSelectedModPack(name);
        });

        selectedModPack.bind(modPack => this.setSelectModPackByName(modPack));
        modPacks.subscribe(event => {
            if (event.Type === CollectionChangeType.Reset) {
                this.setSelectModPackByName(selectedModPack.value);
            }
        });

        this.modPacks.bind(() => this.updateHeader());
    }

    private setSelectModPackByName(modPack: string) {
        this._modPacks.setSingleSelected(modPack);
    }

    private updateHeader() {
        let selectedCount = this._modPacks.selectedCount;
        if (selectedCount === 0) {
            this._header = `Mod Packs (${this.count})`;
        } else {
            let selected = IterableHelper.firstOrDefault(this._modPacks.selected).Name;
            this._header = `Mod Packs (${this.count}) - Selected: ${selected}`;
        }

        this.raise('header', this._header);
    }
}