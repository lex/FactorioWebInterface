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
export class TestServiceLocator extends ServiceLocator {
    static registerBaseServices(serviceLocator) {
        serviceLocator.register(CopyToClipboardService, () => new CopyToClipboardServiceMockBase());
        serviceLocator.register(RequestVerificationService, () => new RequestVerificationServiceMockBase());
        serviceLocator.register(FileSelectionService, () => new FileSelectionServiceMockBase());
        serviceLocator.register(UploadService, (services) => new UploadServiceMockBase());
        serviceLocator.register(ErrorService, () => new ErrorServiceMockBase());
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
//# sourceMappingURL=testServiceLocator.js.map