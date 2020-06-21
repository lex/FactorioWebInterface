import { ObservableObject } from "../../utils/observableObject";
import { CollectionView } from "../../utils/collectionView";
export class ModPackFilesViewModel extends ObservableObject {
    constructor(modsService) {
        super();
        this._title = ModPackFilesViewModel.defaultTitle;
        this._modsService = modsService;
        this._files = new CollectionView(modsService.selectedModPackFiles);
        this._files.sortBy({ property: 'Name', ascending: false });
        modsService.selectedModPack.bind(event => this.title = event ? event : ModPackFilesViewModel.defaultTitle);
    }
    get title() {
        return this._title;
    }
    set title(value) {
        if (this._title === value) {
            return;
        }
        this._title = value;
        this.raise('title', value);
    }
    get files() {
        return this._files;
    }
    get selectedModPack() {
        return this._modsService.selectedModPack.value;
    }
}
ModPackFilesViewModel.defaultTitle = 'No Mod Pack selected.';
//# sourceMappingURL=modPackFilesViewModel.js.map