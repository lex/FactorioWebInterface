import { ServersViewModel } from "./serversViewModel";
import { ServersHubService } from "./serversHubService";
import { ServerIdService } from "./serverIdService";
import { ServerFileService } from "./serverFileService";
import { ServerSettingsService } from "./serverSettingsService";
import { CopyToClipboardService } from "../../services/copyToClipboardService";
import { ServerConsoleService } from "./serverConsoleService";
import { ServerExtraSettingsService } from "./serverExtraSettingsService";
import { FileSelectionService } from "../../services/fileSelectionservice";
import { UploadService } from "../../services/uploadService";
import { ServerFileManagementService } from "./serverFileManagementService";
import { ErrorService } from "../../services/errorService";
export function registerServices(serviceLocator) {
    serviceLocator.register(ServersHubService, () => new ServersHubService());
    serviceLocator.register(ServerIdService, (services) => new ServerIdService(services.get(ServersHubService)));
    serviceLocator.register(ServerFileService, (services) => new ServerFileService(services.get(ServerIdService), services.get(ServersHubService)));
    serviceLocator.register(ServerSettingsService, (services) => new ServerSettingsService(services.get(ServersHubService), services.get(ServerIdService)));
    serviceLocator.register(ServerExtraSettingsService, (services) => new ServerExtraSettingsService(services.get(ServersHubService), services.get(ServerIdService)));
    serviceLocator.register(ServerConsoleService, (services) => new ServerConsoleService(services.get(ServerIdService), services.get(ServersHubService)));
    serviceLocator.register(ServerFileManagementService, (services) => new ServerFileManagementService(services.get(ServerIdService), services.get(ServersHubService), services.get(UploadService)));
    serviceLocator.register(ServersViewModel, (services) => new ServersViewModel(services.get(ServerIdService), services.get(ServerFileService), services.get(ServerSettingsService), services.get(ServerExtraSettingsService), services.get(ServerConsoleService), services.get(ServerFileManagementService), services.get(CopyToClipboardService), services.get(FileSelectionService), services.get(ErrorService)));
    return serviceLocator;
}
//# sourceMappingURL=services.js.map