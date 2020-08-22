import "../../components/component.less";
import { ServiceLocator } from "../../utils/serviceLocator";
import { BansViewModel } from "./bansViewModel";
import { Nav } from "../../shared/nav";
import { NavService } from "../../services/navService";
import { INavService } from "../../services/iNavService";
import { BaseServices } from "../../services/baseServices";
import { registerBansPageServices } from "./services";
import { BansView } from "./bansView";

let serviceLocator = new ServiceLocator();
BaseServices.register(serviceLocator);
registerBansPageServices(serviceLocator);

let navService: NavService = serviceLocator.get(INavService);

let app = document.body
let nav = navService.buildNav(Nav.pageNames.bans);
let bansView = new BansView(serviceLocator.get(BansViewModel));
app.append(nav, bansView.root);
