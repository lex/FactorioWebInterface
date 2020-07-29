import "../../components/component.less";
import { Nav } from "../../shared/nav";
import { ServiceLocator } from "../../utils/serviceLocator";
import { BaseServices } from "../../services/baseServices";
import { INavService } from "../../services/iNavService";
import { ScenarioDataView } from "./scenarioDataView";
import { ScenarioDataViewModel } from "./scenarioDataViewModel";
import { registerScenarioDataPageServices } from "./services";
let serviceLocator = new ServiceLocator();
BaseServices.register(serviceLocator);
registerScenarioDataPageServices(serviceLocator);
let navService = serviceLocator.get(INavService);
let app = document.body;
let nav = navService.buildNav(Nav.pageNames.scenarioData);
let scenarioDataView = new ScenarioDataView(serviceLocator.get(ScenarioDataViewModel));
app.append(nav, scenarioDataView.root);
//# sourceMappingURL=scenarioDataPage.js.map