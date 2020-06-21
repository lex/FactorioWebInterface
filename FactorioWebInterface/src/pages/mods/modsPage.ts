import "../../components/component.less";
import { ServiceLocator } from "../../utils/serviceLocator";
import { BaseServices } from "../../services/baseServices";
import { registerServices } from "./services";
import { ModsView } from "./ModsView";
import { ModsViewModel } from "./modsViewModel";
import { NewModPackViewModel } from "./newModPackViewModel";
import { ViewLocator } from "../../services/viewLocator";
import { NewModPackView } from "./newModPackView";
import { RenameModPackViewModel } from "./renameModPackViewModel";
import { RenameModPackView } from "./renameModPackView";
import { DeleteModPackViewModel } from "./DeleteModPackViewModel";
import { DeleteModPackView } from "./deleteModPackView";

let serviceLocator = new ServiceLocator();
BaseServices.register(serviceLocator);
registerServices(serviceLocator);

let viewLocator: ViewLocator = serviceLocator.get(ViewLocator);
viewLocator.registerViewModel(NewModPackViewModel, (vm: NewModPackViewModel) => new NewModPackView(vm));
viewLocator.registerViewModel(RenameModPackViewModel, (vm: RenameModPackViewModel) => new RenameModPackView(vm));
viewLocator.registerViewModel(DeleteModPackViewModel, (vm: DeleteModPackViewModel) => new DeleteModPackView(vm));

let app = document.getElementById('app');
let modsView = new ModsView(serviceLocator.get(ModsViewModel));
app.append(modsView.root);