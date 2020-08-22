import { ScenarioMetaData } from "./serversTypes";
import { ServersPageTestServiceLocator } from "../../testUtils/testServiceLocator";
import { ScenariosViewModel } from "./scenariosViewModel";
import { ServerFileService } from "./serverFileService";
import { strict } from "assert";
import { IterableHelper } from "../../utils/iterableHelper";
import { ServersViewModel } from "./serversViewModel";
import { ServersHubServiceMockBase } from "../../testUtils/pages/servers/serversHubServiceMockBase";
import { ServersHubService } from "./serversHubService";
import { CollectionChangeType } from "../../ts/utils";

describe('ScenariosViewModel', function () {
    const scenario: ScenarioMetaData = {
        Name: 'scenario',
        CreatedTime: '2020-01-02 00:00:00',
        LastModifiedTime: '2020-01-02 00:00:00'
    };

    const scenario2: ScenarioMetaData = {
        Name: 'scenario2',
        CreatedTime: '2020-01-02 00:00:00',
        LastModifiedTime: '2020-01-02 00:00:00'
    };

    const scenarios = [scenario, scenario2];

    it('can construct', function () {
        // Arrange.
        let services = new ServersPageTestServiceLocator();
        let serverFileService: ServerFileService = services.get(ServerFileService);

        // Act.
        let scenariosViewModel = new ScenariosViewModel(serverFileService.scenarios);

        // Assert.
        strict.equal(scenariosViewModel.count, 0);
        strict.deepEqual([...IterableHelper.map(scenariosViewModel.scenarios, f => f.value)], []);
        strict.equal(scenariosViewModel.header, 'Scenarios (0)');
    });

    it('has initial scenarios', function () {
        // Arrange.
        let services = new ServersPageTestServiceLocator();
        let mainViewModel: ServersViewModel = services.get(ServersViewModel);
        let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

        hubService._scenarios.raise({ Type: CollectionChangeType.Reset, NewItems: scenarios });

        // Act.
        let scenariosViewModel = mainViewModel.scenariosViewModel;

        // Assert.
        strict.deepEqual([...IterableHelper.map(scenariosViewModel.scenarios, f => f.value)], scenarios);
        strict.equal(scenariosViewModel.header, 'Scenarios (2)');
        strict.equal(scenariosViewModel.count, 2);
    });

    it('header shows selected scenario', function () {
        // Arrange.
        let services = new ServersPageTestServiceLocator();
        let mainViewModel: ServersViewModel = services.get(ServersViewModel);
        let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

        hubService._scenarios.raise({ Type: CollectionChangeType.Reset, NewItems: scenarios });

        let scenariosViewModel = mainViewModel.scenariosViewModel;
        let box = scenariosViewModel.scenarios.getBoxByKey(scenario.Name);

        // Act.
        scenariosViewModel.scenarios.setSingleSelected(box);

        // Assert.
        strict.equal(scenariosViewModel.header, 'Scenarios (2) - Selected: scenario');
    });
});