import "../../components/component.less";
import { ServiceLocator } from "../../utils/serviceLocator";
import { BansViewModel } from "./bansViewModel";
import { BansService } from "./bansService";
import { MainView } from "./mainView";

let serviceLocator = new ServiceLocator();
serviceLocator.register(BansService, () => new BansService());
serviceLocator.register(BansViewModel, (services) => new BansViewModel(services.get(BansService)));

let app = document.getElementById('app');
let bansView = new MainView(serviceLocator.get(BansViewModel));
app.appendChild(bansView.root);