import "../../components/component.less";
import { ServersViewModel } from "./serversViewModel";
import { ServersView } from "./serversView";
import { ServiceLocator } from "../../utils/serviceLocator";
import { BaseServices } from "../../services/baseServices";
import { registerServerPageServices } from "./services";
import { ViewLocator } from "../../services/viewLocator";
import { ManageVersionViewModel } from "./manageVersionViewModel";
import { ManageVersionView } from "./manageVersionView";
import { Nav } from "../../shared/nav";
import { INavService } from "../../services/iNavService";
import { NavService } from "../../services/navService";

let serviceLocator = new ServiceLocator();
BaseServices.register(serviceLocator);
registerServerPageServices(serviceLocator);

let viewLocator: ViewLocator = serviceLocator.get(ViewLocator);
viewLocator.registerViewModel(ManageVersionViewModel, (vm: ManageVersionViewModel) => new ManageVersionView(vm));

let navService: NavService = serviceLocator.get(INavService);

let app = document.body;
let nav = navService.buildNav(Nav.pageNames.servers);
let serversView = new ServersView(serviceLocator.get(ServersViewModel));
app.append(nav, serversView.root);
