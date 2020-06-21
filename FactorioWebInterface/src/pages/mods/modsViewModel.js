import { ModPacksViewModel } from "./modPacksViewModel";
import { ModPackFilesViewModel } from "./modPackFilesViewModel";
export class ModsViewModel {
    constructor(modsService, modalService, errorService) {
        this.modPacksViewModel = new ModPacksViewModel(modsService, modalService, errorService);
        this.modPackFilesViewModel = new ModPackFilesViewModel(modsService);
    }
}
//# sourceMappingURL=modsViewModel.js.map