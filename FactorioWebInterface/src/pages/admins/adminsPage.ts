import "../../components/component.less";
import { MainView } from "./mainView";
import { ServiceLocator } from "../../utils/serviceLocator";
import { AdminsService } from "./adminsService";
import { AdminsViewModel } from "./adminsViewModel";

let serviceLocator = new ServiceLocator();
serviceLocator.register(AdminsService, () => new AdminsService());
serviceLocator.register(AdminsViewModel, (services) => new AdminsViewModel(services.get(AdminsService)));

let app = document.getElementById('app');
let adminsView = new MainView(serviceLocator.get(AdminsViewModel));
app.appendChild(adminsView.root);
