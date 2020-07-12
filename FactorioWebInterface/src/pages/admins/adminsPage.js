import "../../components/component.less";
import { MainView } from "./mainView";
import { ServiceLocator } from "../../utils/serviceLocator";
import { AdminsService } from "./adminsService";
import { AdminsViewModel } from "./adminsViewModel";
import { Nav } from "../../shared/nav";
import { INavService } from "../../services/iNavService";
import { BaseServices } from "../../services/baseServices";
let serviceLocator = new ServiceLocator();
BaseServices.register(serviceLocator);
serviceLocator.register(AdminsService, () => new AdminsService());
serviceLocator.register(AdminsViewModel, (services) => new AdminsViewModel(services.get(AdminsService)));
let navService = serviceLocator.get(INavService);
let app = document.body;
let nav = navService.buildNav(Nav.pageNames.admins);
let adminsView = new MainView(serviceLocator.get(AdminsViewModel));
app.append(nav, adminsView.root);
//# sourceMappingURL=adminsPage.js.map