import "../../components/component.less";
import { ServersViewModel } from "./serversViewModel";
import { ServersHubService } from "./serversHubService";
import { ServersView } from "./serversView";
import { ServiceLocator } from "../../utils/serviceLocator";
import { ServerIdService } from "./serverIdService";
import { ServerFileService } from "./serverFileService";
import { ServerSettingsService } from "./serverSettingsService";
import { CopyToClipboardService } from "../../services/copyToClipboardService";
import { ServerConsoleService } from "./serverConsoleService";
import { ServerExtraSettingsService } from "./serverExtraSettingsService";
import { RequestVerificationService } from "../../services/requestVerificationService";
import { FileSelectionService } from "../../services/fileSelectionservice";
import { UploadService } from "../../services/uploadService";
import { ServerFileManagementService } from "./serverFileManagementService";
import { ErrorService } from "../../services/errorService";

let serviceLocator = new ServiceLocator();

serviceLocator.register(CopyToClipboardService, () => new CopyToClipboardService());
serviceLocator.register(RequestVerificationService, () => new RequestVerificationService());
serviceLocator.register(FileSelectionService, () => new FileSelectionService());
serviceLocator.register(UploadService, (services) => new UploadService(services.get(RequestVerificationService)));
serviceLocator.register(ErrorService, () => new ErrorService());

serviceLocator.register(ServersHubService, () => new ServersHubService());
serviceLocator.register(ServerIdService, (services) => new ServerIdService(services.get(ServersHubService)));
serviceLocator.register(ServerFileService, (services) => new ServerFileService(services.get(ServerIdService), services.get(ServersHubService)));
serviceLocator.register(ServerSettingsService, (services) => new ServerSettingsService(services.get(ServersHubService), services.get(ServerIdService)));
serviceLocator.register(ServerExtraSettingsService, (services) => new ServerExtraSettingsService(services.get(ServersHubService), services.get(ServerIdService)));
serviceLocator.register(ServerConsoleService, (services) => new ServerConsoleService(services.get(ServerIdService), services.get(ServersHubService)));

serviceLocator.register(ServerFileManagementService, (services) => new ServerFileManagementService(
    services.get(ServerIdService),
    services.get(ServersHubService),
    services.get(UploadService)));

serviceLocator.register(ServersViewModel, (services) => new ServersViewModel(
    services.get(ServerIdService),
    services.get(ServerFileService),
    services.get(ServerSettingsService),
    services.get(ServerExtraSettingsService),
    services.get(ServerConsoleService),
    services.get(ServerFileManagementService),
    services.get(CopyToClipboardService),
    services.get(FileSelectionService),
    services.get(ErrorService)));

let app = document.getElementById('app');
let serversView = new ServersView(serviceLocator.get(ServersViewModel));
app.append(serversView.root);