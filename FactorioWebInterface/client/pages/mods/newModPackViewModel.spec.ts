import { ModsPageTestServiceLocator } from "../../testUtils/testServiceLocator";
import { NewModPackViewModel } from "./newModPackViewModel";
import { ModsService } from "./modsService";
import { ErrorServiceMockBase } from "../../testUtils/services/errorServiceMockBase";
import { strict } from "assert";
import { ErrorService } from "../../services/errorService";
import { ModsHubServiceMockBase } from "../../testUtils/pages/mods/modsHubServiceMockBase";
import { ModsHubService } from "./modsHubService";
import { PromiseHelper } from "../../utils/promiseHelper";
import { ValidationResult } from "../../utils/validation/module";
import { CollectionChangeType, Result } from "../../ts/utils";
import { ModPackMetaData } from "../servers/serversTypes";
import { assertValidationResultEqual } from "../../testUtils/utils/validation";

describe('NewModPackViewModel', function () {
    const modPack: ModPackMetaData = {
        Name: 'name',
        CreatedTime: '2020-01-01 00:00:00',
        LastModifiedTime: '2020-01-01 00:00:00'
    };

    const modPack2: ModPackMetaData = {
        Name: 'newName',
        CreatedTime: '2020-01-01 00:00:00',
        LastModifiedTime: '2020-01-01 00:00:00'
    };

    it('can construct', function () {
        // Arrange.
        let services = new ModsPageTestServiceLocator();
        let modsService: ModsService = services.get(ModsService);
        let errorService: ErrorServiceMockBase = services.get(ErrorService);

        // Act.
        let viewModel = new NewModPackViewModel(modsService, errorService);

        // Assert.
        strict.equal(viewModel.name, '');
    });

    describe('create command', function () {
        it('can create', async function () {
            // Arrange.            
            let services = new ModsPageTestServiceLocator();
            let modsService: ModsService = services.get(ModsService);
            let errorService: ErrorServiceMockBase = services.get(ErrorService);
            let hub: ModsHubServiceMockBase = services.get(ModsHubService);

            let viewModel = new NewModPackViewModel(modsService, errorService);
            let closeCalled = false;
            viewModel.closeObservable.subscribe(() => closeCalled = true);

            viewModel.name = 'newName';

            // Act.
            viewModel.createCommand.execute();
            await PromiseHelper.delay(0);

            // Assert.            
            hub.assertMethodCalled('createModPack', viewModel.name);
            strict.equal(errorService.methodsCalled.length, 0);
            strict.equal(closeCalled, true);
        });

        describe('does not create when validation error', function () {
            const testCases = [
                { name: 'name with space', input: 'new name', error: ValidationResult.error('Name must not contain whitespace characters.') },
                { name: 'empty name', input: '', error: ValidationResult.error('Name must not be empty.') },
                { name: 'name taken', input: 'name', error: ValidationResult.error('Name must be unique, mod pack \'name\' already exists.') },
                { name: 'name taken after trim', input: ' name ', error: ValidationResult.error('Name must be unique, mod pack \'name\' already exists.') },
            ];

            for (const testCase of testCases) {
                it(testCase.name, function () {
                    // Arrange.            
                    let services = new ModsPageTestServiceLocator();
                    let modsService: ModsService = services.get(ModsService);
                    let errorService: ErrorServiceMockBase = services.get(ErrorService);
                    let hub: ModsHubServiceMockBase = services.get(ModsHubService);

                    hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: [modPack] });

                    let viewModel = new NewModPackViewModel(modsService, errorService);
                    let closeCalled = false;
                    viewModel.closeObservable.subscribe(() => closeCalled = true);

                    viewModel.name = testCase.input;

                    // Act.
                    viewModel.createCommand.execute();

                    // Assert.
                    hub.assertMethodNotCalled('createModPack');
                    strict.equal(errorService.methodsCalled.length, 0);
                    strict.equal(closeCalled, false);

                    let actualError = viewModel.errors.getError('name');
                    assertValidationResultEqual(actualError, testCase.error);
                });
            }
        });        

        class ErrorModsHubServiceMockBase extends ModsHubServiceMockBase {
            _result: Result;

            createModPack(modPack: string): Promise<Result> {
                this.invoked('createModPack', modPack);
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

            let viewModel = new NewModPackViewModel(modsService, errorService);
            viewModel.name = 'newName';

            let closeCalled = false;
            viewModel.closeObservable.subscribe(() => closeCalled = true);

            // Act.
            viewModel.createCommand.execute();
            await PromiseHelper.delay(0);

            // Assert.
            errorService.assertMethodCalled('reportIfError', result);
            strict.equal(closeCalled, false);
        });
    });

    it('change in mod packs updates validation', function () {
        // Arrange.            
        let services = new ModsPageTestServiceLocator();
        let modsService: ModsService = services.get(ModsService);
        let errorService: ErrorServiceMockBase = services.get(ErrorService);
        let hub: ModsHubServiceMockBase = services.get(ModsHubService);

        hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: [modPack] });

        let viewModel = new NewModPackViewModel(modsService, errorService);
        viewModel.name = modPack2.Name;

        strict.equal(viewModel.errors.hasErrors, false);

        // Act.
        hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: [modPack2] });

        // Assert.
        strict.equal(viewModel.errors.hasErrors, true);
        let actualError = viewModel.errors.getError('name');
        assertValidationResultEqual(actualError, ValidationResult.error('Name must be unique, mod pack \'newName\' already exists.'));

        // Act valid.
        hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: [modPack] });

        // Assert.
        strict.equal(viewModel.errors.hasErrors, false);
    });

    it('cancel command does close', function () {
        // Arrange.
        let services = new ModsPageTestServiceLocator();
        let modsService: ModsService = services.get(ModsService);
        let errorService: ErrorServiceMockBase = services.get(ErrorService);
        let hub: ModsHubServiceMockBase = services.get(ModsHubService);

        let viewModel = new NewModPackViewModel(modsService, errorService);
        let closeCalled = false;
        viewModel.closeObservable.subscribe(() => closeCalled = true);

        // Act.
        viewModel.cancelCommand.execute();

        // Assert.
        strict.equal(closeCalled, true);
        hub.assertMethodNotCalled('createModPack');
        strict.equal(errorService.methodsCalled.length, 0);
    });
});