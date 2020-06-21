import { ModsService } from "./modsService";
import { ModPacksViewModel } from "./modPacksViewModel";
import { IModalService } from "../../services/iModalService";
import { ErrorService } from "../../services/errorService";

export class ModsViewModel {
    readonly modPacksViewModel: ModPacksViewModel;

    constructor(modsService: ModsService, modalService: IModalService, errorService: ErrorService) {
        this.modPacksViewModel = new ModPacksViewModel(modsService, modalService, errorService);
    }
}