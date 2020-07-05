var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { strict } from "assert";
import { ServersPageTestServiceLocator } from "../../testUtils/testServiceLocator";
import { ServerIdService } from "./serverIdService";
import { IHiddenInputService } from "../../services/iHiddenInputService";
import { INavigationHistoryService } from "../../services/iNavigationHistoryService";
import { PromiseHelper } from "../../utils/promiseHelper";
describe('ServerIdService', function () {
    it('gets server count', function () {
        // Arrange.          
        let services = new ServersPageTestServiceLocator();
        let hiddenInputeService = services.get(IHiddenInputService);
        hiddenInputeService._map.set('serverCount', '10');
        // Act.
        let serverIdService = services.get(ServerIdService);
        // Assert.
        strict.equal(serverIdService.serverIds.count, 10);
    });
    it('gets selected server', function () {
        // Arrange.          
        let services = new ServersPageTestServiceLocator();
        let hiddenInputeService = services.get(IHiddenInputService);
        hiddenInputeService._map.set('serverSelected', '1');
        // Act.
        let serverIdService = services.get(ServerIdService);
        // Assert.
        strict.equal(serverIdService.currentServerIdValue, '1');
    });
    describe('navigation history', function () {
        it('sets state on init', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();
            let hiddenInputeService = services.get(IHiddenInputService);
            hiddenInputeService._map.set('serverSelected', '1');
            let navigationHistoryService = services.get(INavigationHistoryService);
            let url = undefined;
            let data = undefined;
            navigationHistoryService.methodCalled.subscribe(event => {
                if (event.name === 'replace') {
                    url = event.args[0];
                    data = event.args[1];
                }
            });
            // Act.
            let serverIdService = services.get(ServerIdService);
            // Assert.
            strict.equal(url, '/admin/servers/1');
            strict.equal(data, '1');
        });
        it('sets state when setting server Id', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();
            let hiddenInputeService = services.get(IHiddenInputService);
            hiddenInputeService._map.set('serverSelected', '1');
            let navigationHistoryService = services.get(INavigationHistoryService);
            let url = undefined;
            let data = undefined;
            navigationHistoryService.methodCalled.subscribe(event => {
                if (event.name === 'push') {
                    url = event.args[0];
                    data = event.args[1];
                }
            });
            let serverIdService = services.get(ServerIdService);
            // Act.
            serverIdService.setServerId('2');
            // Assert.
            strict.equal(url, '/admin/servers/2');
            strict.equal(data, '2');
        });
        it('raises events when navigation history onPops raised', function () {
            return __awaiter(this, void 0, void 0, function* () {
                // Arrange.
                let services = new ServersPageTestServiceLocator();
                let hiddenInputeService = services.get(IHiddenInputService);
                hiddenInputeService._map.set('serverSelected', '1');
                let navigationHistoryService = services.get(INavigationHistoryService);
                let serverIdService = services.get(ServerIdService);
                let currentIdEvent = undefined;
                serverIdService.currentServerId.subscribe(event => currentIdEvent = event);
                let clientDataEvent = undefined;
                serverIdService.onClientData.subscribe(event => clientDataEvent = event);
                // Act.
                navigationHistoryService._onPop.raise({ state: '2' });
                yield PromiseHelper.delay(0);
                // Assert.
                strict.equal(currentIdEvent, '2');
                strict.notEqual(clientDataEvent, undefined);
            });
        });
    });
});
//# sourceMappingURL=serverIdService.spec.js.map