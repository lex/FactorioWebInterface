import { ModPackMetaData } from "../servers/serversTypes";
import { RenameModPackViewModel } from "./renameModPackViewModel";
import { ModsPageTestServiceLocator } from "../../testUtils/testServiceLocator";
import { ModsService } from "./modsService";
import { ErrorServiceMockBase } from "../../testUtils/services/errorServiceMockBase";
import { ErrorService } from "../../services/errorService";
import { strict } from "assert";
import { ModsHubServiceMockBase } from "../../testUtils/pages/mods/modsHubServiceMockBase";
import { ModsHubService } from "./modsHubService";
import { CollectionChangeType, Result } from "../../ts/utils";
import { PromiseHelper } from "../../utils/promiseHelper";
import { ValidationResult } from "../../utils/validation/module";
import { assertValidationResultEqual } from "../../testUtils/utils/validation";

describe('RenameModPackViewModel', function () {
    const modPack: ModPackMetaData = {
        Name: 'name',
        CreatedTime: '2020-01-01 00:00:00',
        LastModifiedTime: '2020-01-01 00:00:00'
    };

    const modPack2: ModPackMetaData = {
        Name: 'name2',
        CreatedTime: '2020-01-01 00:00:00',
        LastModifiedTime: '2020-01-01 00:00:00'
    };

    it('can construct', function () {
        // Arrange.
        let services = new ModsPageTestServiceLocator();
        let modsService: ModsService = services.get(ModsService);
        let errorService: ErrorServiceMockBase = services.get(ErrorService);

        // Act.
        let viewModel = new RenameModPackViewModel(modPack, modsService, errorService);

        // Assert.
        strict.equal(viewModel.name, 'name');
    });

    describe('rename command', function () {
        it('can rename', async function () {
            // Arrange.            
            let services = new ModsPageTestServiceLocator();
            let modsService: ModsService = services.get(ModsService);
            let errorService: ErrorServiceMockBase = services.get(ErrorService);
            let hub: ModsHubServiceMockBase = services.get(ModsHubService);

            hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: [modPack, modPack2] });

            let viewModel = new RenameModPackViewModel(modPack, modsService, errorService);
            let closeCalled = false;
            viewModel.closeObservable.subscribe(() => closeCalled = true);

            viewModel.name = 'newName';

            // Act.
            viewModel.renameCommand.execute();
            await PromiseHelper.delay(0);

            // Assert.            
            hub.assertMethodCalled('renameModPack', modPack.Name, viewModel.name);
            strict.equal(errorService.methodsCalled.length, 0);
            strict.equal(closeCalled, true);
        });

        describe('does not create when validation error', function () {
            const testCases = [
                { name: 'name with space', input: 'new name', error: ValidationResult.error('New Name must not contain whitespace characters.') },
                { name: 'empty name', input: '', error: ValidationResult.error('New Name must not be empty.') },
                { name: 'name taken', input: 'name2', error: ValidationResult.error('New Name must be unique, mod pack \'name2\' already exists.') },
                { name: 'name taken after trim', input: ' name ', error: ValidationResult.error('New Name must be unique, mod pack \'name\' already exists.') },
            ];

            for (const testCase of testCases) {
                it(testCase.name, function () {
                    // Arrange.            
                    let services = new ModsPageTestServiceLocator();
                    let modsService: ModsService = services.get(ModsService);
                    let errorService: ErrorServiceMockBase = services.get(ErrorService);
                    let hub: ModsHubServiceMockBase = services.get(ModsHubService);

                    hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: [modPack, modPack2] });

                    let viewModel = new RenameModPackViewModel(modPack, modsService, errorService);
                    let closeCalled = false;
                    viewModel.closeObservable.subscribe(() => closeCalled = true);

                    viewModel.name = testCase.input;

                    // Act.
                    viewModel.renameCommand.execute();

                    // Assert.
                    hub.assertMethodNotCalled('renameModPack');
                    strict.equal(errorService.methodsCalled.length, 0);
                    strict.equal(closeCalled, false);

                    let actualError = viewModel.errors.getError('name');
                    assertValidationResultEqual(actualError, testCase.error);
                });
            }
        });

        class ErrorModsHubServiceMockBase extends ModsHubServiceMockBase {
            _result: Result;

            renameModPack(oldName: string, newName: string): Promise<Result> {
                this.invoked('renameModPack', oldName, newName);
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

            hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: [modPack, modPack2] });

            let result: Result = {
                Success: false
            };
            hub._result = result;

            let viewModel = new RenameModPackViewModel(modPack, modsService, errorService);
            viewModel.name = 'newName';

            let closeCalled = false;
            viewModel.closeObservable.subscribe(() => closeCalled = true);

            // Act.
            viewModel.renameCommand.execute();
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

        let viewModel = new RenameModPackViewModel(modPack, modsService, errorService);
        viewModel.name = modPack2.Name

        strict.equal(viewModel.errors.hasErrors, false);

        // Act.
        hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: [modPack2] });

        // Assert.
        strict.equal(viewModel.errors.hasErrors, true);
        let actualError = viewModel.errors.getError('name');
        assertValidationResultEqual(actualError, ValidationResult.error('New Name must be unique, mod pack \'name2\' already exists.'));

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

        let viewModel = new RenameModPackViewModel(modPack, modsService, errorService);
        let closeCalled = false;
        viewModel.closeObservable.subscribe(() => closeCalled = true);

        // Act.
        viewModel.cancelCommand.execute();

        // Assert.
        strict.equal(closeCalled, true);
        hub.assertMethodNotCalled('renameModPack');
        strict.equal(errorService.methodsCalled.length, 0);
    });
});