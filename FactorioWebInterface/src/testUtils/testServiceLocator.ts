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
import { registerServices } from "../pages/servers/services";
import { WindowService } from "../services/windowService";
import { WindowServiceMockBase } from "./services/windowServiceMockBase";
import { ModalServiceBase } from "../services/ModalServiceBase";
import { ModalServiceMockBase } from "./services/modalServiceMockBase";

export class TestServiceLocator extends ServiceLocator {
    static registerBaseServices(serviceLocator: ServiceLocator): ServiceLocator {
        serviceLocator.register(CopyToClipboardService, () => new CopyToClipboardServiceMockBase());
        serviceLocator.register(RequestVerificationService, () => new RequestVerificationServiceMockBase());
        serviceLocator.register(FileSelectionService, () => new FileSelectionServiceMockBase());
        serviceLocator.register(UploadService, () => new UploadServiceMockBase());
        serviceLocator.register(ErrorService, () => new ErrorServiceMockBase());
        serviceLocator.register(WindowService, () => new WindowServiceMockBase());
        serviceLocator.register(ModalServiceBase, () => new ModalServiceMockBase());

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

        registerServices(this);
        this.register(ServersHubService, () => new ServersHubServiceMockBase());
    }
}