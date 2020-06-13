import { ServersViewModel } from "./serversViewModel";
import { ServersHubService } from "./serversHubService";
import { ServiceLocator } from "../../utils/serviceLocator";
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
import { WindowService } from "../../services/windowService";
import { IModalService } from "../../services/iModalService";
import { ManageVersionService } from "./manageVersionService";

export function registerServices(serviceLocator: ServiceLocator): ServiceLocator {
    serviceLocator.register(ServersHubService, () => new ServersHubService());
    serviceLocator.register(ServerIdService, (services) => new ServerIdService(services.get(ServersHubService)));
    serviceLocator.register(ServerFileService, (services) => new ServerFileService(services.get(ServerIdService), services.get(ServersHubService)));
    serviceLocator.register(ServerSettingsService, (services) => new ServerSettingsService(services.get(ServersHubService), services.get(ServerIdService)));
    serviceLocator.register(ServerExtraSettingsService, (services) => new ServerExtraSettingsService(services.get(ServersHubService), services.get(ServerIdService)));
    serviceLocator.register(ServerConsoleService, (services) => new ServerConsoleService(services.get(ServerIdService), services.get(ServersHubService)));
    serviceLocator.register(ManageVersionService, (services) => new ManageVersionService(services.get(ServersHubService)));

    serviceLocator.register(ServerFileManagementService, (services) => new ServerFileManagementService(
        services.get(ServerIdService),
        services.get(ServersHubService),
        services.get(UploadService),
        services.get(WindowService)));

    serviceLocator.register(ServersViewModel, (services) => new ServersViewModel(
        services.get(ServerIdService),
        services.get(ServerFileService),
        services.get(ServerSettingsService),
        services.get(ServerExtraSettingsService),
        services.get(ServerConsoleService),
        services.get(ServerFileManagementService),
        services.get(ManageVersionService),
        services.get(CopyToClipboardService),
        services.get(FileSelectionService),
        services.get(ErrorService),
        services.get(IModalService)))

    return serviceLocator;
}