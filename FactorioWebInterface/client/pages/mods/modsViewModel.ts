import { ModsService } from "./modsService";
import { ModPacksViewModel } from "./modPacksViewModel";
import { IModalService } from "../../services/iModalService";
import { ErrorService } from "../../services/errorService";
import { ModPackFilesViewModel } from "./modPackFilesViewModel";
import { FileSelectionService } from "../../services/fileSelectionService";

export class ModsViewModel {
    readonly modPacksViewModel: ModPacksViewModel;
    readonly modPackFilesViewModel: ModPackFilesViewModel;

    constructor(modsService: ModsService, modalService: IModalService, errorService: ErrorService, fileSelectionService: FileSelectionService) {
        this.modPacksViewModel = new ModPacksViewModel(modsService, modalService, errorService);
        this.modPackFilesViewModel = new ModPackFilesViewModel(modsService, fileSelectionService, errorService);

        this.modPacksViewModel.modPacks.sortChanged.bind(event => this.modPackFilesViewModel.modPacks.sortBy(event));
    }
}
