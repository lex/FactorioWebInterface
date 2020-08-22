import { ServiceLocator } from "../../utils/serviceLocator";
import { AdminsService } from "./adminsService";
import { AdminsViewModel } from "./adminsViewModel";
import { AdminsHubService } from "./adminsHubService";
import { ErrorService } from "../../services/errorService";

export function registerAdminsPageServices(serviceLocator: ServiceLocator): ServiceLocator {
    serviceLocator.register(AdminsHubService, () => new AdminsHubService());
    serviceLocator.register(AdminsService, (services) => new AdminsService(services.get(AdminsHubService)));

    serviceLocator.register(AdminsViewModel, (services) => new AdminsViewModel(
        services.get(AdminsService),
        services.get(ErrorService)));

    return serviceLocator;
}