import { ServiceLocator } from "../utils/serviceLocator";
import { CopyToClipboardService } from "./copyToClipboardService";
import { RequestVerificationService } from "./requestVerificationService";
import { FileSelectionService } from "./fileSelectionservice";
import { UploadService } from "./uploadService";
import { ErrorService } from "./errorService";
import { WindowService } from "./windowService";

export class BaseServices {
    static register(serviceLocator: ServiceLocator): ServiceLocator {
        serviceLocator.register(CopyToClipboardService, () => new CopyToClipboardService());
        serviceLocator.register(RequestVerificationService, () => new RequestVerificationService());
        serviceLocator.register(FileSelectionService, () => new FileSelectionService());
        serviceLocator.register(UploadService, (services) => new UploadService(services.get(RequestVerificationService)));
        serviceLocator.register(ErrorService, () => new ErrorService());
        serviceLocator.register(WindowService, () => new WindowService());

        return serviceLocator;
    }
}