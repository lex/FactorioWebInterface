import { FileViewModel } from "./fileViewModel";
import { ServersConsoleViewModel } from "./serversConsoleViewModel";
import { LogFileViewModel } from "./logFileViewModel";
import { ScenariosViewModel } from "./scenariosViewModel";
import { ModPacksViewModel } from "./modPacksViewModel";
import { ServerSettingsViewModel } from "./serverSettingsViewModel";
import { ServerExtraSettingsViewModel } from "./serverExtraSettingsViewModel";
import { ServerFileManagementViewModel } from "./serverFileManagementViewModel";
export class ServersViewModel {
    constructor(serverIdService, serverFileService, serverSettingsService, serverExtraSettingsService, serverConsoleService, serverFileManagementService, mangeVersionService, copyToClipboardService, fileSelectionService, errorService, modalService) {
        this.serverSettingsViewModel = new ServerSettingsViewModel(serverSettingsService, copyToClipboardService, errorService);
        this.serverExtraSettingsViewModel = new ServerExtraSettingsViewModel(serverExtraSettingsService, copyToClipboardService, errorService);
        this.tempFileViewModel = new FileViewModel('Temp Saves', serverFileService.tempSaveFiles, serverIdService.serverId);
        this.localFileViewModel = new FileViewModel('Local Saves', serverFileService.localSaveFiles, serverIdService.serverId);
        this.globalFileViewModel = new FileViewModel('Global Saves', serverFileService.globalSaveFiles, serverIdService.serverId);
        this.logFileViewModel = new LogFileViewModel('Logs', serverFileService.logFiles, 'logFile');
        this.chatLogFileViewModel = new LogFileViewModel('Chat Logs', serverFileService.chatLogsFiles, 'chatLogFile');
        this.scenariosViewModel = new ScenariosViewModel(serverFileService.scenarios);
        this.modPacksViewModel = new ModPacksViewModel(serverFileService);
        this.serverConsoleViewModel = new ServersConsoleViewModel(serverIdService, serverConsoleService, mangeVersionService, serverSettingsService, modalService, errorService, this.tempFileViewModel, this.localFileViewModel, this.globalFileViewModel, this.scenariosViewModel);
        this.serverFileManagementViewModel = new ServerFileManagementViewModel(serverFileManagementService, fileSelectionService, errorService, this.tempFileViewModel, this.localFileViewModel, this.globalFileViewModel);
    }
}
//# sourceMappingURL=serversViewModel.js.map