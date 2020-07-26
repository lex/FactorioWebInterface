import { BansHubService } from "./bansHubService";
import { BansService } from "./bansService";
import { BansViewModel } from "./bansViewModel";
import { ErrorService } from "../../services/errorService";
import { IHiddenInputService } from "../../services/iHiddenInputService";
export function registerBansPageServices(serviceLocator) {
    serviceLocator.register(BansHubService, () => new BansHubService());
    serviceLocator.register(BansService, (services) => new BansService(services.get(BansHubService), services.get(IHiddenInputService)));
    serviceLocator.register(BansViewModel, (services) => new BansViewModel(services.get(BansService), services.get(ErrorService)));
    return serviceLocator;
}
//# sourceMappingURL=services.js.map