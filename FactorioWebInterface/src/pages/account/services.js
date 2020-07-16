import { AccountViewModel } from "./accountViewModel";
import { AccountService } from "./accountService";
import { UploadService } from "../../services/uploadService";
import { WindowService } from "../../services/windowService";
import { IHiddenInputService } from "../../services/iHiddenInputService";
export function registerAccountPageServices(serviceLocator) {
    serviceLocator.register(AccountService, (services) => new AccountService(services.get(UploadService), services.get(WindowService), services.get(IHiddenInputService)));
    serviceLocator.register(AccountViewModel, (services) => new AccountViewModel(services.get(AccountService)));
    return serviceLocator;
}
//# sourceMappingURL=services.js.map