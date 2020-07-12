import "../../components/component.less";
import { ServiceLocator } from "../../utils/serviceLocator";
import { BansViewModel } from "./bansViewModel";
import { BansService } from "./bansService";
import { MainView } from "./mainView";
import { Nav } from "../../shared/nav";
import { NavService } from "../../services/navService";
import { INavService } from "../../services/iNavService";
import { BaseServices } from "../../services/baseServices";

let serviceLocator = new ServiceLocator();
BaseServices.register(serviceLocator);
serviceLocator.register(BansService, () => new BansService());
serviceLocator.register(BansViewModel, (services) => new BansViewModel(services.get(BansService)));

let navService: NavService = serviceLocator.get(INavService);

let app = document.body
let nav = navService.buildNav(Nav.pageNames.bans);
let bansView = new MainView(serviceLocator.get(BansViewModel));
app.append(nav, bansView.root);
