import "../../components/component.less";
import { ServiceLocator } from "../../utils/serviceLocator";
import { AdminsViewModel } from "./adminsViewModel";
import { Nav } from "../../shared/nav";
import { INavService } from "../../services/iNavService";
import { BaseServices } from "../../services/baseServices";
import { registerAdminsPageServices } from "./services";
import { AdminsView } from "./adminsView";
let serviceLocator = new ServiceLocator();
BaseServices.register(serviceLocator);
registerAdminsPageServices(serviceLocator);
let navService = serviceLocator.get(INavService);
let app = document.body;
let nav = navService.buildNav(Nav.pageNames.admins);
let adminsView = new AdminsView(serviceLocator.get(AdminsViewModel));
app.append(nav, adminsView.root);
//# sourceMappingURL=adminsPage.js.map