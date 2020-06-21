import { ModPacksViewModel } from "./modPacksViewModel";
export class ModsViewModel {
    constructor(modsService, modalService, errorService) {
        this.modPacksViewModel = new ModPacksViewModel(modsService, modalService, errorService);
    }
}
//# sourceMappingURL=modsViewModel.js.map