import { ServiceLocator } from "../utils/serviceLocator";
import { CopyToClipboardService } from "../services/copyToClipboardService";
import { RequestVerificationService } from "../services/requestVerificationService";
import { FileSelectionService } from "../services/fileSelectionService";
import { UploadService } from "../services/uploadService";
import { ErrorService } from "../services/errorService";
import { ErrorServiceMockBase } from "./services/errorServiceMockBase";
import { UploadServiceMockBase } from "./services/uploadServiceMockBase";
import { FileSelectionServiceMockBase } from "./services/fileSelectionServiceMockBase";
import { RequestVerificationServiceMockBase } from "./services/requestVerificationServiceMockBase";
import { CopyToClipboardServiceMockBase } from "./services/copyToClipboardServiceMockBase";
import { ServersHubService } from "../pages/servers/serversHubService";
import { ServersHubServiceMockBase } from "./pages/servers/serversHubServiceMockBase";
import { registerServerPageServices } from "../pages/servers/services";
import { registerBansPageServices } from "../pages/bans/services";
import { registerAdminsPageServices } from "../pages/admins/services";
import { registerScenarioDataPageServices } from "../pages/scenarioData/services";
import { registerModsPageServices } from "../pages/mods/services";
import { registerAccountPageServices } from "../pages/account/services";
import { WindowService } from "../services/windowService";
import { WindowServiceMockBase } from "./services/windowServiceMockBase";
import { IModalService } from "../services/iModalService";
import { ModalServiceMockBase } from "./services/modalServiceMockBase";
import { IHiddenInputService } from "../services/iHiddenInputService";
import { HiddenInputServiceMockBase } from "./services/hiddenInputServiceMockBase";
import { INavigationHistoryService } from "../services/iNavigationHistoryService";
import { NavigationHistoryServiceMockBase } from "./services/navigationHistoryServiceMockBase";
import { ModsHubServiceMockBase } from "./pages/mods/modsHubServiceMockBase";
import { ModsHubService } from "../pages/mods/modsHubService";
import { AdminsHubService } from "../pages/admins/adminsHubService";
import { AdminsHubServiceMockBase } from "./pages/admins/adminsHubServiceMockBase";
import { BansHubService } from "../pages/bans/bansHubService";
import { BansHubServiceMockBase } from "./pages/bans/bansHubServiceMockBase";
import { ScenarioDataHubService } from "../pages/scenarioData/scenarioDataHubService";
import { ScenarioDataHubServiceMockBase } from "./pages/scenarioData/scenarioDataHubServiceMockBase";

export class TestServiceLocator extends ServiceLocator {
    static registerBaseServices(serviceLocator: ServiceLocator): ServiceLocator {
        serviceLocator.register(CopyToClipboardService, () => new CopyToClipboardServiceMockBase());
        serviceLocator.register(RequestVerificationService, () => new RequestVerificationServiceMockBase());
        serviceLocator.register(FileSelectionService, () => new FileSelectionServiceMockBase());
        serviceLocator.register(UploadService, () => new UploadServiceMockBase());
        serviceLocator.register(ErrorService, () => new ErrorServiceMockBase());
        serviceLocator.register(WindowService, () => new WindowServiceMockBase());
        serviceLocator.register(IModalService, () => new ModalServiceMockBase());
        serviceLocator.register(IHiddenInputService, () => new HiddenInputServiceMockBase());
        serviceLocator.register(INavigationHistoryService, () => new NavigationHistoryServiceMockBase());

        return serviceLocator;
    }

    constructor() {
        super();

        TestServiceLocator.registerBaseServices(this);
    }
}

export class ServersPageTestServiceLocator extends TestServiceLocator {
    constructor() {
        super();

        registerServerPageServices(this);
        this.register(ServersHubService, () => new ServersHubServiceMockBase());
    }
}

export class BansPageTestServiceLocator extends TestServiceLocator {
    constructor() {
        super();

        registerBansPageServices(this);
        this.register(BansHubService, () => new BansHubServiceMockBase());
    }
}

export class AdminsPageTestServiceLocator extends TestServiceLocator {
    constructor() {
        super();

        registerAdminsPageServices(this);
        this.register(AdminsHubService, () => new AdminsHubServiceMockBase());
    }
}

export class ScenarioDataPageTestServiceLocator extends TestServiceLocator {
    constructor() {
        super();

        registerScenarioDataPageServices(this);
        this.register(ScenarioDataHubService, () => new ScenarioDataHubServiceMockBase());
    }
}

export class ModsPageTestServiceLocator extends TestServiceLocator {
    constructor() {
        super();

        registerModsPageServices(this);
        this.register(ModsHubService, () => new ModsHubServiceMockBase());
    }
}

export class AccountPageTestServiceLocator extends TestServiceLocator {
    constructor() {
        super();

        registerAccountPageServices(this);
    }
}
