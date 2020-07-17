import "../../components/component.less";
import { ServiceLocator } from "../../utils/serviceLocator";
import { BaseServices } from "../../services/baseServices";
import { registerModsPageServices } from "./services";
import { ModsView } from "./ModsView";
import { ModsViewModel } from "./modsViewModel";
import { NewModPackViewModel } from "./newModPackViewModel";
import { ViewLocator } from "../../services/viewLocator";
import { NewModPackView } from "./newModPackView";
import { RenameModPackViewModel } from "./renameModPackViewModel";
import { RenameModPackView } from "./renameModPackView";
import { DeleteModPackViewModel } from "./DeleteModPackViewModel";
import { DeleteModPackView } from "./deleteModPackView";
import { Nav } from "../../shared/nav";
import { NavService } from "../../services/navService";
import { INavService } from "../../services/iNavService";

let serviceLocator = new ServiceLocator();
BaseServices.register(serviceLocator);
registerModsPageServices(serviceLocator);

let viewLocator: ViewLocator = serviceLocator.get(ViewLocator);
viewLocator.registerViewModel(NewModPackViewModel, (vm: NewModPackViewModel) => new NewModPackView(vm));
viewLocator.registerViewModel(RenameModPackViewModel, (vm: RenameModPackViewModel) => new RenameModPackView(vm));
viewLocator.registerViewModel(DeleteModPackViewModel, (vm: DeleteModPackViewModel) => new DeleteModPackView(vm));

let navService: NavService = serviceLocator.get(INavService);

let app = document.body;
let nav = navService.buildNav(Nav.pageNames.mods);
let modsView = new ModsView(serviceLocator.get(ModsViewModel));
app.append(nav, modsView.root);
