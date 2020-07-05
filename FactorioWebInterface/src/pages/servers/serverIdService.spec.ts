import { strict } from "assert";
import { ServersPageTestServiceLocator } from "../../testUtils/testServiceLocator";
import { ServerIdService } from "./serverIdService";
import { IHiddenInputService } from "../../services/iHiddenInputService";
import { HiddenInputServiceMockBase } from "../../testUtils/services/hiddenInputServiceMockBase";
import { NavigationHistoryServiceMockBase } from "../../testUtils/services/navigationHistoryServiceMockBase";
import { INavigationHistoryService } from "../../services/iNavigationHistoryService";
import { FactorioControlClientData } from "./serversTypes";
import { PromiseHelper } from "../../utils/promiseHelper";

describe('ServerIdService', function () {
    it('gets server count', function () {
        // Arrange.          
        let services = new ServersPageTestServiceLocator();

        let hiddenInputeService: HiddenInputServiceMockBase = services.get(IHiddenInputService);
        hiddenInputeService._map.set('serverCount', '10');

        // Act.
        let serverIdService: ServerIdService = services.get(ServerIdService);

        // Assert.
        strict.equal(serverIdService.serverIds.count, 10);
    });

    it('gets selected server', function () {
        // Arrange.          
        let services = new ServersPageTestServiceLocator();

        let hiddenInputeService: HiddenInputServiceMockBase = services.get(IHiddenInputService);
        hiddenInputeService._map.set('serverSelected', '1');

        // Act.
        let serverIdService: ServerIdService = services.get(ServerIdService);

        // Assert.
        strict.equal(serverIdService.currentServerIdValue, '1');
    });

    describe('navigation history', function () {
        it('sets state on init', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();

            let hiddenInputeService: HiddenInputServiceMockBase = services.get(IHiddenInputService);
            hiddenInputeService._map.set('serverSelected', '1');

            let navigationHistoryService: NavigationHistoryServiceMockBase = services.get(INavigationHistoryService);

            let url: string = undefined;
            let data: string = undefined;

            navigationHistoryService.methodCalled.subscribe(event => {
                if (event.name === 'replace') {
                    url = event.args[0];
                    data = event.args[1];
                }
            });

            // Act.
            let serverIdService: ServerIdService = services.get(ServerIdService);

            // Assert.
            strict.equal(url, '/admin/servers/1');
            strict.equal(data, '1');
        });

        it('sets state when setting server Id', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();

            let hiddenInputeService: HiddenInputServiceMockBase = services.get(IHiddenInputService);
            hiddenInputeService._map.set('serverSelected', '1');

            let navigationHistoryService: NavigationHistoryServiceMockBase = services.get(INavigationHistoryService);

            let url: string = undefined;
            let data: string = undefined;

            navigationHistoryService.methodCalled.subscribe(event => {
                if (event.name === 'push') {
                    url = event.args[0];
                    data = event.args[1];
                }
            });

            let serverIdService: ServerIdService = services.get(ServerIdService);

            // Act.
            serverIdService.setServerId('2');

            // Assert.
            strict.equal(url, '/admin/servers/2');
            strict.equal(data, '2');
        });

        it('raises events when navigation history onPops raised', async function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();

            let hiddenInputeService: HiddenInputServiceMockBase = services.get(IHiddenInputService);
            hiddenInputeService._map.set('serverSelected', '1');

            let navigationHistoryService: NavigationHistoryServiceMockBase = services.get(INavigationHistoryService);

            let serverIdService: ServerIdService = services.get(ServerIdService);

            let currentIdEvent: string = undefined;
            serverIdService.currentServerId.subscribe(event => currentIdEvent = event);

            let clientDataEvent: FactorioControlClientData = undefined
            serverIdService.onClientData.subscribe(event => clientDataEvent = event);

            // Act.
            navigationHistoryService._onPop.raise({ state: '2' } as PopStateEvent);
            await PromiseHelper.delay(0);

            // Assert.
            strict.equal(currentIdEvent, '2');
            strict.notEqual(clientDataEvent, undefined);
        });
    });
});