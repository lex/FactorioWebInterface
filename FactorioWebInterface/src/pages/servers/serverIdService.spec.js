import { strict } from "assert";
import { ServersPageTestServiceLocator } from "../../testUtils/testServiceLocator";
import { ServerIdService } from "./serverIdService";
import { IHiddenInputService } from "../../services/iHiddenInputService";
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
});
//# sourceMappingURL=serverIdService.spec.js.map