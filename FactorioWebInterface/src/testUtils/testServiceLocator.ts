import { ServiceLocator } from "../utils/serviceLocator";
import { CopyToClipboardService } from "../services/copyToClipboardService";
import { RequestVerificationService } from "../services/requestVerificationService";
import { FileSelectionService } from "../services/fileSelectionservice";
import { UploadService } from "../services/uploadService";
import { ErrorService } from "../services/errorService";
import { ErrorServiceMockBase } from "./services/errorServiceMockBase";
import { UploadServiceMockBase } from "./services/uploadServiceMockBase";
import { FileSelectionServiceMockBase } from "./services/fileSelectionServiceMockBase";
import { RequestVerificationServiceMockBase } from "./services/requestVerificationServiceMockBase";
import { CopyToClipboardServiceMockBase } from "./services/copyToClipboardServiceMockBase";
import { ServersHubService } from "../pages/servers/serversHubService";
import { ServersHubServiceMockBase } from "./pages/servers/serversHubServiceMockBase";
import { registerServerPageServices } from "../pages/servers/services";
import { registerAccountPageServices } from "../pages/account/services";
import { WindowService } from "../services/windowService";
import { WindowServiceMockBase } from "./services/windowServiceMockBase";
import { IModalService } from "../services/iModalService";
import { ModalServiceMockBase } from "./services/modalServiceMockBase";
import { IHiddenInputService } from "../services/iHiddenInputService";
import { HiddenInputServiceMockBase } from "./services/hiddenInputServiceMockBase";
import { INavigationHistoryService } from "../services/iNavigationHistoryService";
import { NavigationHistoryServiceMockBase } from "./services/navigationHistoryServiceMockBase";

export class TestServiceLocator extends ServiceLocator {
    static registerBaseServices(serviceLocator: ServiceLocator): ServiceLocator {
        serviceLocator.register(CopyToClipboardService, () => new CopyToClipboardServiceMockBase());
        serviceLocator.register(RequestVerificationService, () => new RequestVerificationServiceMockBase());
        serviceLocator.register(FileSelectionService, () => new FileSelectionServiceMockBase());
        serviceLocator.register(UploadService, () => new UploadServiceMockBase());
        serviceLocator.register(ErrorService, () => new ErrorServiceMockBase());
        serviceLocator.register(WindowService, () => new WindowServiceMockBase());
        serviceLocator.register(IModalService, () => new ModalServiceMockBase());
        serviceLocator.register(IHiddenInputService, () => new HiddenInputServiceMockBase());
        serviceLocator.register(INavigationHistoryService, () => new NavigationHistoryServiceMockBase());

        return serviceLocator;
    }

    constructor() {
        super();

        TestServiceLocator.registerBaseServices(this);
    }
}

export class ServersPageTestServiceLocator extends TestServiceLocator {
    constructor() {
        super();

        registerServerPageServices(this);
        this.register(ServersHubService, () => new ServersHubServiceMockBase());
    }
}

export class AccountPageTestServiceLocator extends TestServiceLocator {
    constructor() {
        super();

        registerAccountPageServices(this);
    }
}
