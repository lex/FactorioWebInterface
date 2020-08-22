import "../../components/component.less";
import { ServiceLocator } from "../../utils/serviceLocator";
import { BaseServices } from "../../services/baseServices";
import { NavService } from "../../services/navService";
import { INavService } from "../../services/iNavService";
import { Nav } from "../../shared/nav";
import { registerAccountPageServices } from "./services";
import { AccountView } from "./accountView";
import { AccountViewModel } from "./accountViewModel";

let serviceLocator = new ServiceLocator();
BaseServices.register(serviceLocator);
registerAccountPageServices(serviceLocator);

let navService: NavService = serviceLocator.get(INavService);

let app = document.body;
let nav = navService.buildNav(Nav.pageNames.account);
let accountView = new AccountView(serviceLocator.get(AccountViewModel));
app.append(nav, accountView.root);
