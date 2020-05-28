import "../../components/component.less";
import { ServersViewModel } from "./serversViewModel";
import { ServersView } from "./serversView";
import { ServiceLocator } from "../../utils/serviceLocator";
import { BaseServices } from "../../services/baseServices";
import { registerServices } from "./services";

let serviceLocator = new ServiceLocator();
BaseServices.register(serviceLocator);
registerServices(serviceLocator);

let app = document.getElementById('app');
let serversView = new ServersView(serviceLocator.get(ServersViewModel));
app.append(serversView.root);