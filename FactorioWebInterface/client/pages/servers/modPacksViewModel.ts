import { ModPackMetaData } from "./serversTypes";
import { ObservableObject } from "../../utils/observableObject";
import { ServerFileService } from "./serverFileService";
import { ObservableCollection, CollectionView, CollectionViewChangeType } from "../../utils/collections/module";
import { IterableHelper } from "../../utils/iterableHelper";
import { CollectionChangeType } from "../../ts/utils";
import { IObservableProperty } from "../../utils/observableProperty";

export class ModPacksViewModel extends ObservableObject {
    private _sourceModPacks: ObservableCollection<ModPackMetaData>;

    private _header: string;
    private _modPacks: CollectionView<string, ModPackMetaData>;
    private _selectedModPack: IObservableProperty<string>;

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
        this._selectedModPack = serverFileService.selectedModPack;

        this._sourceModPacks = modPacks;
        this._modPacks = new CollectionView(modPacks);
        this._modPacks.sortBy({ property: 'LastModifiedTime', ascending: false });
        this._modPacks.newSingleSelectedChanged.subscribe(event => {
            if (event.type == CollectionViewChangeType.Reset) {
                // This only happens if the collection is reset, which only happens from the backend when fetching the mod packs.
                // So this isn't user input and shouldn't change which mod pack is selected.
                return;
            }

            let name = IterableHelper.firstOrDefault(this._modPacks.selectedKeys) ?? '';
            serverFileService.setSelectedModPack(name);
        });

        this._selectedModPack.bind(modPack => {
            this.setSelectModPackByName(modPack);
            this.updateHeader();
        });
        modPacks.subscribe(event => {
            if (event.Type === CollectionChangeType.Reset) {
                this.setSelectModPackByName(this._selectedModPack.value);
            }
        });

        this.modPacks.bind(() => this.updateHeader());
    }

    private setSelectModPackByName(modPack: string) {
        this._modPacks.setSingleSelected(modPack);
    }

    private updateHeader() {
        let selected = this._selectedModPack.value ?? '';

        if (selected) {
            this._header = `Mod Packs (${this.count}) - Selected: ${selected}`;
        } else {
            this._header = `Mod Packs (${this.count})`;
        }

        this.raise('header', this._header);
    }
}