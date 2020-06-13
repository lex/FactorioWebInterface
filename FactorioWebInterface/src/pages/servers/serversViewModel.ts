import { FileViewModel } from "./fileViewModel";
import { ServersConsoleViewModel } from "./serversConsoleViewModel";
import { LogFileViewModel } from "./logFileViewModel";
import { ScenariosViewModel } from "./scenariosViewModel";
import { ModPacksViewModel } from "./modPacksViewModel";
import { ServerFileService } from "./serverFileService";
import { ServerIdService } from "./serverIdService";
import { ServerSettingsViewModel } from "./serverSettingsViewModel";
import { ServerSettingsService } from "./serverSettingsService";
import { ServerExtraSettingsService } from "./serverExtraSettingsService";
import { CopyToClipboardService } from "../../services/copyToClipboardService";
import { ServerConsoleService } from "./serverConsoleService";
import { ServerExtraSettingsViewModel } from "./serverExtraSettingsViewModel";
import { ServerFileManagementViewModel } from "./serverFileManagementViewModel";
import { ServerFileManagementService } from "./serverFileManagementService";
import { FileSelectionService } from "../../services/fileSelectionservice";
import { ErrorService } from "../../services/errorService";
import { IModalService } from "../../services/iModalService";
import { ManageVersionService } from "./manageVersionService";

export class ServersViewModel {
    readonly serverConsoleViewModel: ServersConsoleViewModel;
    readonly serverSettingsViewModel: ServerSettingsViewModel;
    readonly serverExtraSettingsViewModel: ServerExtraSettingsViewModel;

    readonly serverFileManagementViewModel: ServerFileManagementViewModel;
    readonly tempFileViewModel: FileViewModel;
    readonly localFileViewModel: FileViewModel;
    readonly globalFileViewModel: FileViewModel;
    readonly logFileViewModel: LogFileViewModel;
    readonly chatLogFileViewModel: LogFileViewModel;
    readonly scenariosViewModel: ScenariosViewModel;
    readonly modPacksViewModel: ModPacksViewModel;

    constructor(
        serverIdService: ServerIdService,
        serverFileService: ServerFileService,
        serverSettingsService: ServerSettingsService,
        serverExtraSettingsService: ServerExtraSettingsService,
        serverConsoleService: ServerConsoleService,
        serverFileManagementService: ServerFileManagementService,
        mangeVersionService: ManageVersionService,
        copyToClipboardService: CopyToClipboardService,
        fileSelectionService: FileSelectionService,
        errorService: ErrorService,
        modalService: IModalService
    ) {
        this.serverSettingsViewModel = new ServerSettingsViewModel(serverSettingsService, copyToClipboardService, errorService);
        this.serverExtraSettingsViewModel = new ServerExtraSettingsViewModel(serverExtraSettingsService, copyToClipboardService, errorService);

        this.tempFileViewModel = new FileViewModel('Temp Files', serverFileService.tempSaveFiles, serverIdService.serverId);
        this.localFileViewModel = new FileViewModel('Local Files', serverFileService.localSaveFiles, serverIdService.serverId);
        this.globalFileViewModel = new FileViewModel('Global Files', serverFileService.globalSaveFiles, serverIdService.serverId);
        this.logFileViewModel = new LogFileViewModel('Logs', serverFileService.logFiles, 'logFile');
        this.chatLogFileViewModel = new LogFileViewModel('Chat Logs', serverFileService.chatLogsFiles, 'chatLogFile');
        this.scenariosViewModel = new ScenariosViewModel(serverFileService.scenarios);
        this.modPacksViewModel = new ModPacksViewModel(serverFileService);

        this.serverConsoleViewModel = new ServersConsoleViewModel(
            serverIdService,
            serverConsoleService,
            mangeVersionService,
            modalService,
            errorService,
            this.tempFileViewModel,
            this.localFileViewModel,
            this.globalFileViewModel,
            this.scenariosViewModel);

        this.serverFileManagementViewModel = new ServerFileManagementViewModel(
            serverFileManagementService,
            fileSelectionService,
            errorService,
            this.tempFileViewModel,
            this.localFileViewModel,
            this.globalFileViewModel);
    }
}