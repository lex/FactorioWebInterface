import { ModsHubService } from "./modsHubService";
import { ModsService } from "./modsService";
import { UploadService } from "../../services/uploadService";
import { WindowService } from "../../services/windowService";
import { ModsViewModel } from "./modsViewModel";
import { IModalService } from "../../services/iModalService";
import { ErrorService } from "../../services/errorService";
export function registerServices(serviceLocator) {
    serviceLocator.register(ModsHubService, () => new ModsHubService());
    serviceLocator.register(ModsService, (services) => new ModsService(services.get(ModsHubService), services.get(UploadService), services.get(WindowService)));
    serviceLocator.register(ModsViewModel, (services) => new ModsViewModel(services.get(ModsService), services.get(IModalService), services.get(ErrorService)));
    return serviceLocator;
}
//# sourceMappingURL=services.js.map