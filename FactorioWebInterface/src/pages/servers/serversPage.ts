import "../../components/component.less";
import { ServersViewModel } from "./serversViewModel";
import { ServersView } from "./serversView";
import { ServiceLocator } from "../../utils/serviceLocator";
import { BaseServices } from "../../services/baseServices";
import { registerServices } from "./services";
import { ViewLocator } from "../../services/viewLocator";
import { ManageVersionViewModel } from "./manageVersionViewModel";
import { ManageVersionView } from "./manageVersionView";

let serviceLocator = new ServiceLocator();
BaseServices.register(serviceLocator);
registerServices(serviceLocator);

serviceLocator.register(ViewLocator, () => new ViewLocator());
let viewLocator: ViewLocator = serviceLocator.get(ViewLocator);
viewLocator.registerViewModel(ManageVersionViewModel, (vm: ManageVersionViewModel) => new ManageVersionView(vm));

let app = document.getElementById('app');
let serversView = new ServersView(serviceLocator.get(ServersViewModel));
app.append(serversView.root);