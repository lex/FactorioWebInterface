import { ModsService } from "./modsService";
import { ModPacksViewModel } from "./modPacksViewModel";
import { IModalService } from "../../services/iModalService";
import { ErrorService } from "../../services/errorService";
import { ModPackFilesViewModel } from "./modPackFilesViewModel";

export class ModsViewModel {
    readonly modPacksViewModel: ModPacksViewModel;
    readonly modPackFilesViewModel: ModPackFilesViewModel;

    constructor(modsService: ModsService, modalService: IModalService, errorService: ErrorService) {
        this.modPacksViewModel = new ModPacksViewModel(modsService, modalService, errorService);
        this.modPackFilesViewModel = new ModPackFilesViewModel(modsService);
    }
}