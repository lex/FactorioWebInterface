import { ObservableObject } from "../../utils/observableObject";
import { CollectionView } from "../../utils/collectionView";
import { ModPackFileMetaData } from "../servers/serversTypes";
import { ModsService } from "./modsService";

export class ModPackFilesViewModel extends ObservableObject<ModPackFilesViewModel>{
    static readonly defaultTitle = 'No Mod Pack selected.';

    private _modsService: ModsService;

    private _files: CollectionView<ModPackFileMetaData>;

    private _title = ModPackFilesViewModel.defaultTitle;

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

    get files(): CollectionView<ModPackFileMetaData> {
        return this._files;
    }

    get selectedModPack(): string {
        return this._modsService.selectedModPack.value;
    }

    constructor(modsService: ModsService) {
        super();

        this._modsService = modsService;

        this._files = new CollectionView(modsService.selectedModPackFiles);
        this._files.sortBy({ property: 'Name', ascending: false });

        modsService.selectedModPack.bind(event => this.title = event ? event : ModPackFilesViewModel.defaultTitle);
    }
}