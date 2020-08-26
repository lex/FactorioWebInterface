import { ModPackMetaData } from "./serversTypes";
import { ServersPageTestServiceLocator } from "../../testUtils/testServiceLocator";
import { ServerFileService } from "./serverFileService";
import { ModPacksViewModel } from "./modPacksViewModel";
import { strict } from "assert";
import { ServersViewModel } from "./serversViewModel";
import { ServersHubServiceMockBase } from "../../testUtils/pages/servers/serversHubServiceMockBase";
import { CollectionChangeType } from "../../ts/utils";
import { ServersHubService } from "./serversHubService";

describe('ModPacksViewModel', function () {
    const modPack: ModPackMetaData = {
        Name: 'modpack',
        CreatedTime: '2020-01-02 00:00:00',
        LastModifiedTime: '2020-01-02 00:00:00'
    };

    const modPack2: ModPackMetaData = {
        Name: 'modpack2',
        CreatedTime: '2020-01-01 00:00:00',
        LastModifiedTime: '2020-01-01 00:00:00'
    };

    const modPacks = [modPack, modPack2];

    it('can construct', function () {
        // Arrange.
        let services = new ServersPageTestServiceLocator();
        let serverFileService: ServerFileService = services.get(ServerFileService);

        // Act.
        let modPacksViewModel = new ModPacksViewModel(serverFileService);

        // Assert.
        strict.equal(modPacksViewModel.count, 0);
        strict.deepEqual([...modPacksViewModel.modPacks], []);
        strict.equal(modPacksViewModel.header, 'Mod Packs (0)');
    });

    it('has initial modpacks', function () {
        // Arrange.
        let services = new ServersPageTestServiceLocator();
        let mainViewModel: ServersViewModel = services.get(ServersViewModel);
        let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

        hubService._modPacks.raise({ Type: CollectionChangeType.Reset, NewItems: modPacks });

        // Act.
        let modPacksViewModel = mainViewModel.modPacksViewModel;

        // Assert.
        strict.deepEqual([...modPacksViewModel.modPacks], modPacks);
        strict.equal(modPacksViewModel.header, 'Mod Packs (2)');
        strict.equal(modPacksViewModel.count, 2);
    });

    it('header shows selected mod pack', function () {
        // Arrange.
        let services = new ServersPageTestServiceLocator();
        let mainViewModel: ServersViewModel = services.get(ServersViewModel);
        let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

        hubService._modPacks.raise({ Type: CollectionChangeType.Reset, NewItems: modPacks });

        let modPacksViewModel = mainViewModel.modPacksViewModel;

        // Act.
        modPacksViewModel.modPacks.setSingleSelected(modPack.Name);

        // Assert.
        strict.equal(modPacksViewModel.header, 'Mod Packs (2) - Selected: modpack');
    });

    it('selected modpack updates when onSelectedModPack raised', function () {
        // Arrange.
        let services = new ServersPageTestServiceLocator();
        let mainViewModel: ServersViewModel = services.get(ServersViewModel);
        let modPacksViewModel = mainViewModel.modPacksViewModel;

        let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
        hubService._modPacks.raise({ Type: CollectionChangeType.Reset, NewItems: modPacks });

        // Act.
        hubService._onSelectedModPack.raise('modpack');

        // Assert.
        let selected = [...modPacksViewModel.modPacks.selected];
        strict.deepEqual(selected, [modPack]);
    });

    it('selected modpack unselected when onSelectedModPack raised with missing modpack', function () {
        // Arrange.
        let services = new ServersPageTestServiceLocator();
        let mainViewModel: ServersViewModel = services.get(ServersViewModel);

        let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
        hubService._modPacks.raise({ Type: CollectionChangeType.Reset, NewItems: modPacks });

        let modPacksViewModel = mainViewModel.modPacksViewModel;
        modPacksViewModel.modPacks.setSingleSelected(modPack.Name);

        strict.equal(modPacksViewModel.modPacks.selectedCount, 1);

        // Act.
        hubService._onSelectedModPack.raise('missing');

        // Assert.
        let selected = [...modPacksViewModel.modPacks.selected];
        strict.deepEqual(selected, []);
    });

    it('selecting modpack sends to hub', function () {
        // Arrange.
        let services = new ServersPageTestServiceLocator();
        let mainViewModel: ServersViewModel = services.get(ServersViewModel);

        let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
        hubService._modPacks.raise({ Type: CollectionChangeType.Reset, NewItems: modPacks });

        let modPacksViewModel = mainViewModel.modPacksViewModel;

        // Act.        
        modPacksViewModel.modPacks.setSingleSelected(modPack.Name);

        // Assert.        
        hubService.assertMethodCalled('setSelectedModPack', modPack.Name);
    });
});