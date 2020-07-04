import { VirtualComponent } from "../../components/virtualComponent";
import { FileView } from "./fileView";
import { ServersConsoleView } from "./serversConsoleView";
import { LogFileView } from "./logFileView";
import { ScenariosView } from "./scenariosView";
import { ModPacksView } from "./modPacksView";
import { FlexPanel } from "../../components/flexPanel";
import { ServerSettingsView } from "./serverSettingsView";
import { ServerExtraSettingsView } from "./serverExtraSettingsView";
import { ServerFileManagementView } from "./serverFileManagementView";
export class ServersView extends VirtualComponent {
    constructor(serversViewModel) {
        super();
        let mainPanel = new FlexPanel(FlexPanel.classes.largeColumns);
        this._root = mainPanel;
        let leftPanel = new FlexPanel(FlexPanel.classes.vertical, FlexPanel.classes.spacingNone, FlexPanel.classes.childSpacingInclusive);
        let rightPanel = new FlexPanel(FlexPanel.classes.vertical, FlexPanel.classes.spacingNone, FlexPanel.classes.childSpacingInclusive);
        mainPanel.append(leftPanel, rightPanel);
        let serversConsoleView = new ServersConsoleView(serversViewModel.serverConsoleViewModel);
        let serverSettingsView = new ServerSettingsView(serversViewModel.serverSettingsViewModel);
        let serverExtraSettingsView = new ServerExtraSettingsView(serversViewModel.serverExtraSettingsViewModel);
        leftPanel.append(serversConsoleView.root, serverSettingsView.root, serverExtraSettingsView.root);
        let fileManagementView = new ServerFileManagementView(serversViewModel.serverFileManagementViewModel);
        let tempFiles = new FileView(serversViewModel.tempFileViewModel);
        let localFiles = new FileView(serversViewModel.localFileViewModel);
        let globalFiles = new FileView(serversViewModel.globalFileViewModel);
        let scenarios = new ScenariosView(serversViewModel.scenariosViewModel);
        let modPacks = new ModPacksView(serversViewModel.modPacksViewModel);
        let logFiles = new LogFileView(serversViewModel.logFileViewModel);
        let chatLogFiles = new LogFileView(serversViewModel.chatLogFileViewModel);
        rightPanel.append(fileManagementView.root, tempFiles.root, localFiles.root, globalFiles.root, scenarios.root, modPacks.root, logFiles.root, chatLogFiles.root);
    }
}
//# sourceMappingURL=serversView.js.map