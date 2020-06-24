import { ModPacksViewModel } from "./modPacksViewModel";
import { ModPackFilesViewModel } from "./modPackFilesViewModel";
export class ModsViewModel {
    constructor(modsService, modalService, errorService, fileSelectionService) {
        this.modPacksViewModel = new ModPacksViewModel(modsService, modalService, errorService);
        this.modPackFilesViewModel = new ModPackFilesViewModel(modsService, fileSelectionService, errorService);
        this.modPacksViewModel.modPacks.sortChanged.bind(event => this.modPackFilesViewModel.modPacks.sortBy(event));
    }
}
//# sourceMappingURL=modsViewModel.js.map