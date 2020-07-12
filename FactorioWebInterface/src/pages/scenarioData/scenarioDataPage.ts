import "../../components/component.less";
import { MainView } from "./mainView";
import { Nav } from "../../shared/nav";
import { ServiceLocator } from "../../utils/serviceLocator";
import { BaseServices } from "../../services/baseServices";
import { NavService } from "../../services/navService";
import { INavService } from "../../services/iNavService";

let serviceLocator = new ServiceLocator();
BaseServices.register(serviceLocator);

let navService: NavService = serviceLocator.get(INavService);

let app = document.body;
let nav = navService.buildNav(Nav.pageNames.scenarioData);
let scenarioDataPage = new MainView();
app.append(nav, scenarioDataPage.root);