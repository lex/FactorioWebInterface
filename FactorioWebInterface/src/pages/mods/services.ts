import { ServiceLocator } from "../../utils/serviceLocator";
import { ModsHubService } from "./modsHubService";
import { ModsService } from "./modsService";
import { UploadService } from "../../services/uploadService";
import { WindowService } from "../../services/windowService";
import { ModsViewModel } from "./modsViewModel";
import { IModalService } from "../../services/iModalService";
import { ErrorService } from "../../services/errorService";
import { FileSelectionService } from "../../services/fileSelectionservice";

export function registerModsPageServices(serviceLocator: ServiceLocator): ServiceLocator {
    serviceLocator.register(ModsHubService, () => new ModsHubService());
    serviceLocator.register(ModsService, (services) => new ModsService(
        services.get(ModsHubService),
        services.get(UploadService),
        services.get(WindowService)));

    serviceLocator.register(ModsViewModel, (services) => new ModsViewModel(
        services.get(ModsService),
        services.get(IModalService),
        services.get(ErrorService),
        services.get(FileSelectionService)));

    return serviceLocator;
}