import { ModsPageTestServiceLocator } from "../../testUtils/testServiceLocator";
import { DeleteModPackViewModel } from "./deleteModPackViewModel";
import { ModPackMetaData } from "../servers/serversTypes";
import { ModsService } from "./modsService";
import { ErrorService } from "../../services/errorService";
import { strict } from "assert";
import { ModsHubServiceMockBase } from "../../testUtils/pages/mods/modsHubServiceMockBase";
import { ModsHubService } from "./modsHubService";
import { ErrorServiceMockBase } from "../../testUtils/services/errorServiceMockBase";
import { PromiseHelper } from "../../utils/promiseHelper";
import { Result } from "../../ts/utils";

describe('DeleteModPackViewModel', function () {
    const modPack: ModPackMetaData = {
        Name: 'name',
        CreatedTime: '2020-01-01 00:00:00',
        LastModifiedTime: '2020-01-01 00:00:00'
    };

    it('can construct', function () {
        // Arrange.
        let services = new ModsPageTestServiceLocator();
        let modsService: ModsService = services.get(ModsService);
        let errorService: ErrorServiceMockBase = services.get(ErrorService);

        // Act.
        let viewModel = new DeleteModPackViewModel(modPack, modsService, errorService);

        // Assert.
        strict.equal(viewModel.name, modPack.Name);
    });

    describe('delete command', function () {
        it('does delete', async function () {
            // Arrange.
            let services = new ModsPageTestServiceLocator();
            let modsService: ModsService = services.get(ModsService);
            let errorService: ErrorServiceMockBase = services.get(ErrorService);
            let hub: ModsHubServiceMockBase = services.get(ModsHubService);

            let viewModel = new DeleteModPackViewModel(modPack, modsService, errorService);

            let closeCalled = false;
            viewModel.closeObservable.subscribe(() => closeCalled = true);

            // Act.
            viewModel.deleteCommand.execute();
            await PromiseHelper.delay(0);

            // Assert.
            hub.assertMethodCalled('deleteModPack', modPack.Name);
            strict.equal(errorService.methodsCalled.length, 0);
            strict.equal(closeCalled, true);
        });

        class ErrorModsHubServiceMockBase extends ModsHubServiceMockBase {
            _result: Result;

            deleteModPack(modPack: string): Promise<Result> {
                this.invoked('deleteModPack', modPack);
                return Promise.resolve(this._result);
            }
        }

        it('reports error', async function () {
            // Arrange.
            let services = new ModsPageTestServiceLocator();
            services.register(ModsHubService, () => new ErrorModsHubServiceMockBase());

            let modsService: ModsService = services.get(ModsService);
            let errorService: ErrorServiceMockBase = services.get(ErrorService);
            let hub: ErrorModsHubServiceMockBase = services.get(ModsHubService);

            let result: Result = {
                Success: false
            };
            hub._result = result;

            let viewModel = new DeleteModPackViewModel(modPack, modsService, errorService);

            let closeCalled = false;
            viewModel.closeObservable.subscribe(() => closeCalled = true);

            // Act.
            viewModel.deleteCommand.execute();
            await PromiseHelper.delay(0);

            // Assert.
            errorService.assertMethodCalled('reportIfError', result);
            strict.equal(closeCalled, false);
        });
    });

    it('cancel command does close', function () {
        // Arrange.
        let services = new ModsPageTestServiceLocator();
        let modsService: ModsService = services.get(ModsService);
        let errorService: ErrorServiceMockBase = services.get(ErrorService);
        let hub: ModsHubServiceMockBase = services.get(ModsHubService);

        let viewModel = new DeleteModPackViewModel(modPack, modsService, errorService);
        let closeCalled = false;
        viewModel.closeObservable.subscribe(() => closeCalled = true);

        // Act.
        viewModel.cancelCommand.execute();

        // Assert.
        strict.equal(closeCalled, true);
        hub.assertMethodNotCalled('deleteModPack');
        strict.equal(errorService.methodsCalled.length, 0);
    });
});
