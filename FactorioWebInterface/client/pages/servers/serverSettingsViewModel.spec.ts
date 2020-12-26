import { strict } from "assert";
import { ServerSettingsViewModel } from "./serverSettingsViewModel";
import { FactorioServerSettings } from "./serversTypes";
import { CollectionChangeType, Result, KeyValueCollectionChangedData } from "../../ts/utils";
import { propertyOf } from "../../utils/types";
import { ServersPageTestServiceLocator } from "../../testUtils/testServiceLocator";
import { ServersViewModel } from "./serversViewModel";
import { ServersHubServiceMockBase } from "../../testUtils/pages/servers/serversHubServiceMockBase";
import { ServersHubService } from "./serversHubService";
import { PromiseHelper } from "../../utils/promiseHelper";
import { ErrorServiceMockBase } from "../../testUtils/services/errorServiceMockBase";
import { ErrorService } from "../../services/errorService";
import { CopyToClipboardServiceMockBase } from "../../testUtils/services/copyToClipboardServiceMockBase";
import { CopyToClipboardService } from "../../services/copyToClipboardService";

describe('ServerSettingsViewModel', function () {
    function assertSettingsEqualViewModel(settings: Partial<ServerSettingsViewModel>, viewModel: ServerSettingsViewModel) {
        strict.equal(settings.Name, viewModel.Name);
        strict.equal(settings.Description, viewModel.Description);
        strict.equal(settings.Tags, viewModel.Tags);
        strict.equal(settings.MaxPlayers, viewModel.MaxPlayers);
        strict.equal(settings.GamePassword, viewModel.GamePassword);
        strict.equal(settings.MaxUploadSlots, viewModel.MaxUploadSlots);
        strict.equal(settings.AutoPause, viewModel.AutoPause);
        strict.equal(settings.UseDefaultAdmins, viewModel.UseDefaultAdmins);
        strict.equal(settings.Admins, viewModel.Admins);
        strict.equal(settings.AutosaveInterval, viewModel.AutosaveInterval);
        strict.equal(settings.AutosaveSlots, viewModel.AutosaveSlots);
        strict.equal(settings.NonBlockingSaving, viewModel.NonBlockingSaving);
        strict.equal(settings.PublicVisible, viewModel.PublicVisible);
    }

    const serverSettingsTestCases: { property: propertyOf<ServerSettingsViewModel>, value: any, settingValue: any }[] = [
        { property: 'Name', value: 'new value', settingValue: 'new value' },
        { property: 'Description', value: 'new value', settingValue: 'new value' },
        { property: 'Tags', value: 'new value', settingValue: ['new value'] },
        { property: 'MaxPlayers', value: 10, settingValue: 10 },
        { property: 'GamePassword', value: 'new value', settingValue: 'new value' },
        { property: 'MaxUploadSlots', value: 0, settingValue: 0 },
        { property: 'AutoPause', value: false, settingValue: false },
        { property: 'UseDefaultAdmins', value: false, settingValue: false },
        { property: 'Admins', value: 'new value', settingValue: ['new value'] },
        { property: 'AutosaveInterval', value: 10, settingValue: 10 },
        { property: 'AutosaveSlots', value: 10, settingValue: 10 },
        { property: 'AfkAutokickInterval', value: 10, settingValue: 10 },
        { property: 'NonBlockingSaving', value: false, settingValue: false },
        { property: 'PublicVisible', value: false, settingValue: false },
    ];

    describe('starts with default values', function () {
        for (let testCase of serverSettingsTestCases) {
            it(testCase.property, function () {
                // Arrange.          
                let services = new ServersPageTestServiceLocator();
                let mainViewModel: ServersViewModel = services.get(ServersViewModel);

                // Act.
                let viewModel = mainViewModel.serverSettingsViewModel;

                // Assert.                
                let actual = viewModel[testCase.property]
                let expected = ServerSettingsViewModel.formFieldsDefaultValues[testCase.property];
                strict.equal(actual, expected);
            });
        }
    });

    describe('setting null sets to default value', function () {
        for (let testCase of serverSettingsTestCases) {
            it(testCase.property, function () {
                // Arrange.          
                let services = new ServersPageTestServiceLocator();
                let mainViewModel: ServersViewModel = services.get(ServersViewModel);
                let viewModel = mainViewModel.serverSettingsViewModel;
                let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

                let settings = {};
                settings[testCase.property] = null;
                let settingsEvent = { Type: CollectionChangeType.Add, NewItems: settings };

                // Act.
                hubService._onServerSettingsUpdate.raise({ data: settingsEvent, markUnsaved: false });

                // Assert.                
                let actual = viewModel[testCase.property];
                let expected = ServerSettingsViewModel.formFieldsDefaultValues[testCase.property];
                strict.equal(actual, expected);
                strict.equal(viewModel.saved, true);
            });
        }
    });

    describe('updates onServerSettings', function () {
        for (let testCase of serverSettingsTestCases) {
            it(testCase.property, function () {
                // Arrange.          
                let services = new ServersPageTestServiceLocator();
                let mainViewModel: ServersViewModel = services.get(ServersViewModel);
                let viewModel = mainViewModel.serverSettingsViewModel;
                let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

                let settings = {} as FactorioServerSettings;
                for (let prop of serverSettingsTestCases) {
                    settings[prop.property] = prop.settingValue;
                }

                let actaulPropertyValue: any = undefined;
                viewModel.propertyChanged(testCase.property, event => actaulPropertyValue = event);

                // Act.
                hubService._onServerSettings.raise({ settings: settings, saved: false });

                // Assert.
                strict.equal(actaulPropertyValue, testCase.value);
                strict.equal(viewModel.saved, false);
            });
        }
    });

    describe('setting form property triggers updates', function () {
        for (let testCase of serverSettingsTestCases) {
            it(testCase.property, function () {
                // Arrange.
                let services = new ServersPageTestServiceLocator();
                let mainViewModel: ServersViewModel = services.get(ServersViewModel);
                let viewModel = mainViewModel.serverSettingsViewModel;
                let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

                let expectedSettings = {};
                expectedSettings[testCase.property] = testCase.settingValue;
                let expectedUpdateSettings = { Type: CollectionChangeType.Add, NewItems: expectedSettings };

                let actaulUpdateSettings: any = undefined;
                hubService.methodCalled.subscribe(event => {
                    if (event.name === 'updateServerSettings') {
                        actaulUpdateSettings = event.args[0];
                    }
                });

                let actaulPropertyValue: any = undefined;
                viewModel.propertyChanged(testCase.property, event => actaulPropertyValue = event);

                let saved = viewModel.saved;
                strict.equal(saved, true);
                viewModel.propertyChanged('saved', event => saved = event);

                // Act.
                viewModel[testCase.property as string] = testCase.value;

                // Assert.            
                strict.equal(actaulPropertyValue, testCase.value);
                strict.deepEqual(actaulUpdateSettings, expectedUpdateSettings);
                strict.equal(saved, false);
            });
        }
    });

    describe('setting form property to invalid when default triggers updates', function () {
        const testCases = [
            { property: 'Name', value: ' ' },
            { property: 'Description', value: ' ' },
            { property: 'Tags', value: ' ' },
            { property: 'MaxPlayers', value: -1 },
            { property: 'MaxUploadSlots', value: -1 },
            { property: 'Admins', value: ' ' },
            { property: 'AutosaveSlots', value: -1 },
            { property: 'AfkAutokickInterval', value: -1 },
        ]
        for (let testCase of testCases) {
            it(testCase.property, function () {
                // Arrange.
                const defaultValue = ServerSettingsViewModel.formFieldsDefaultValues[testCase.property]

                let services = new ServersPageTestServiceLocator();
                let mainViewModel: ServersViewModel = services.get(ServersViewModel);
                let viewModel = mainViewModel.serverSettingsViewModel;

                viewModel[testCase.property] = defaultValue;

                let actaulPropertyValue: any = undefined;
                viewModel.propertyChanged(testCase.property as propertyOf<ServerSettingsViewModel>, event => actaulPropertyValue = event);

                // Act.
                viewModel[testCase.property as string] = testCase.value;

                // Assert.            
                strict.deepEqual(actaulPropertyValue, defaultValue);
            });
        }
    });

    describe('setting from update triggers property', function () {
        for (let testCase of serverSettingsTestCases) {
            it(testCase.property, function () {
                // Arrange.
                let services = new ServersPageTestServiceLocator();
                let mainViewModel: ServersViewModel = services.get(ServersViewModel);
                let viewModel = mainViewModel.serverSettingsViewModel;
                let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

                let actaulPropertyValue = undefined;
                viewModel.propertyChanged(testCase.property, event => actaulPropertyValue = event);

                let settings = {};
                settings[testCase.property] = testCase.settingValue;
                let settingsEvent = { Type: CollectionChangeType.Add, NewItems: settings };

                // Act.
                hubService._onServerSettingsUpdate.raise({ data: settingsEvent, markUnsaved: true });

                // Assert.
                strict.equal(actaulPropertyValue, testCase.value);
                strict.equal(viewModel.saved, false);
                hubService.assertMethodNotCalled('updateServerSettings');
            });
        }
    });

    describe('setting UseDefaultAdmins updates adminsEditEnabled', function () {
        let testCases = [
            { value: false, expected: true },
            { value: true, expected: false }
        ];

        for (let testCase of testCases) {
            it(`from property: ${testCase.value}`, function () {
                // Arrange.
                let services = new ServersPageTestServiceLocator();
                let mainViewModel: ServersViewModel = services.get(ServersViewModel);

                let viewModel = mainViewModel.serverSettingsViewModel;
                viewModel.UseDefaultAdmins = !testCase.value;

                let actaulRaised = undefined;
                viewModel.propertyChanged('adminsEditEnabled', event => actaulRaised = event);

                // Act.
                viewModel.UseDefaultAdmins = testCase.value;

                // Assert.
                strict.equal(actaulRaised, testCase.expected);
            });
        }

        for (let testCase of testCases) {
            it(`from settings: ${testCase.value}`, function () {
                // Arrange.
                let services = new ServersPageTestServiceLocator();
                let mainViewModel: ServersViewModel = services.get(ServersViewModel);
                let viewModel = mainViewModel.serverSettingsViewModel;
                let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

                viewModel.UseDefaultAdmins = !testCase.value;

                let actaulRaised = undefined;
                viewModel.propertyChanged('adminsEditEnabled', event => actaulRaised = event);

                let settings = {};
                settings['UseDefaultAdmins'] = testCase.value;
                let settingsEvent = { Type: CollectionChangeType.Add, NewItems: settings };

                // Act.
                hubService._onServerSettingsUpdate.raise({ data: settingsEvent, markUnsaved: false });

                // Assert.
                strict.equal(actaulRaised, testCase.expected);
            });
        }
    });

    describe('save command', function () {
        it('can execute', async function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();
            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverSettingsViewModel;
            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            viewModel.AutoPause = false;

            let actualSettings: FactorioServerSettings = undefined;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'saveServerSettings') {
                    actualSettings = event.args[0];
                }
            });

            let expectedSettings: FactorioServerSettings = {
                Name: '',
                Description: '',
                Tags: [],
                MaxPlayers: 0,
                GamePassword: '',
                MaxUploadSlots: 32,
                AutoPause: false,
                UseDefaultAdmins: true,
                Admins: [],
                AutosaveInterval: 5,
                AutosaveSlots: 20,
                AfkAutokickInterval: 0,
                NonBlockingSaving: true,
                PublicVisible: true
            };

            // Act.
            strict.equal(viewModel.saveCommand.canExecute(), true);
            viewModel.saveCommand.execute();
            await PromiseHelper.delay(0);

            // Assert.
            strict.deepEqual(actualSettings, expectedSettings);
        });

        it('can not execute when no unsaved changes', async function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();
            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverSettingsViewModel;
            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            // Act.
            strict.equal(viewModel.saved, true);
            strict.equal(viewModel.saveCommand.canExecute(), false);
            viewModel.saveCommand.execute();
            await PromiseHelper.delay(0);

            // Assert.
            hubService.assertMethodNotCalled('saveServerSettings');
        });

        it('can execute changes when saved changes', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();
            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverSettingsViewModel;

            let canExecuteChangedCalled = false;
            viewModel.saveCommand.canExecuteChanged.subscribe(() => canExecuteChangedCalled = true);

            strict.equal(viewModel.saveCommand.canExecute(), false);

            // Act.
            viewModel.AutoPause = false;

            // Assert.
            strict.equal(viewModel.saveCommand.canExecute(), true);
            strict.equal(canExecuteChangedCalled, true);
        });

        class ErrorServersHubServiceMockBase extends ServersHubServiceMockBase {
            _result: Result;

            saveServerSettings(settings: FactorioServerSettings): Promise<Result> {
                this.invoked('saveServerSettings', settings);
                return Promise.resolve(this._result);
            }
        }

        it('reports error', async function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();
            services.register(ServersHubService, () => new ErrorServersHubServiceMockBase());

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverSettingsViewModel;

            let result: Result = { Success: false, Errors: [{ Key: 'some key', Description: 'some description' }] };
            let hubService: ErrorServersHubServiceMockBase = services.get(ServersHubService);
            hubService._result = result;

            let errorService: ErrorServiceMockBase = services.get(ErrorService);

            viewModel.AutoPause = false;

            // Act.
            strict.equal(viewModel.saveCommand.canExecute(), true);
            viewModel.saveCommand.execute();
            await PromiseHelper.delay(0);

            // Assert.
            hubService.assertMethodCalled('saveServerSettings');
            errorService.assertMethodCalled('reportIfError', result);
        });
    });

    describe('undo command', function () {
        it('can execute', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();
            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverSettingsViewModel;
            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            viewModel.AutoPause = false;

            // Act.
            strict.equal(viewModel.undoCommand.canExecute(), true);
            viewModel.undoCommand.execute();

            // Assert.
            hubService.assertMethodCalled('undoServerSettings');
        });

        it('can not execute when no unsaved changes', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();
            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverSettingsViewModel;
            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            // Act.
            strict.equal(viewModel.saved, true);
            strict.equal(viewModel.undoCommand.canExecute(), false);
            viewModel.undoCommand.execute();

            // Assert.
            hubService.assertMethodNotCalled('undoServerSettings');
        });

        it('can execute changes when saved changes', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();
            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverSettingsViewModel;

            let canExecuteChangedCalled = false;
            viewModel.undoCommand.canExecuteChanged.subscribe(() => canExecuteChangedCalled = true);

            strict.equal(viewModel.undoCommand.canExecute(), false);

            // Act.
            viewModel.AutoPause = false;

            // Assert.
            strict.equal(viewModel.undoCommand.canExecute(), true);
            strict.equal(canExecuteChangedCalled, true);
        });
    });

    it('copy command does copy settings to clipboard', function () {
        // Arrange.
        let services = new ServersPageTestServiceLocator();

        let clipboardService: CopyToClipboardServiceMockBase = services.get(CopyToClipboardService);

        let actualText;
        clipboardService.methodCalled.subscribe(event => {
            if (event.name === 'copy') {
                actualText = event.args[0];
            }
        });

        let mainViewModel: ServersViewModel = services.get(ServersViewModel);
        let viewModel = mainViewModel.serverSettingsViewModel;

        viewModel.Name = ' Name ';
        viewModel.Description = ' Description ';
        viewModel.Tags = 'tag1\ntag2\ntag3';
        viewModel.MaxPlayers = 10;
        viewModel.GamePassword = 'password';
        viewModel.MaxUploadSlots = 16;
        viewModel.AutoPause = false;
        viewModel.UseDefaultAdmins = true;
        viewModel.Admins = 'admin1, admin2';
        viewModel.AutosaveInterval = 4;
        viewModel.AutosaveSlots = 8;
        viewModel.AfkAutokickInterval = 12;
        viewModel.NonBlockingSaving = true;
        viewModel.PublicVisible = false;

        let expectedSettings: FactorioServerSettings = {
            Name: 'Name',
            Description: 'Description',
            Tags: ['tag1', 'tag2', 'tag3'],
            MaxPlayers: 10,
            GamePassword: 'password',
            MaxUploadSlots: 16,
            AutoPause: false,
            UseDefaultAdmins: true,
            Admins: ['admin1', 'admin2'],
            AutosaveInterval: 4,
            AutosaveSlots: 8,
            AfkAutokickInterval: 12,
            NonBlockingSaving: true,
            PublicVisible: false
        };

        // Act.
        viewModel.copyCommand.execute();

        // Assert.        
        let settings = JSON.parse(actualText);
        strict.deepEqual(settings, expectedSettings);
    });

    describe('paste settings', function () {
        it('starts with normal paste text', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();
            let mainViewModel: ServersViewModel = services.get(ServersViewModel);

            // Act.
            let viewModel = mainViewModel.serverSettingsViewModel;

            // Assert.
            strict.equal(viewModel.pasteText, ServerSettingsViewModel.normalPasteText);
        });

        it('does paste settings', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();
            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverSettingsViewModel;
            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let settings: FactorioServerSettings = {
                Name: 'Name2',
                Description: 'Description2',
                Tags: ['tag1', 'tag2', 'tag3'],
                MaxPlayers: 10,
                GamePassword: 'password',
                MaxUploadSlots: 16,
                AutoPause: false,
                UseDefaultAdmins: false,
                Admins: ['admin1', 'admin2'],
                AutosaveInterval: 4,
                AutosaveSlots: 8,
                AfkAutokickInterval: 12,
                NonBlockingSaving: false,
                PublicVisible: false
            };

            let expectedViewModel: Partial<ServerSettingsViewModel> = {
                Name: 'Name2',
                Description: 'Description2',
                Tags: 'tag1\ntag2\ntag3',
                MaxPlayers: 10,
                GamePassword: 'password',
                MaxUploadSlots: 16,
                AutoPause: false,
                UseDefaultAdmins: false,
                Admins: 'admin1, admin2',
                AutosaveInterval: 4,
                AutosaveSlots: 8,
                AfkAutokickInterval: 12,
                NonBlockingSaving: false,
                PublicVisible: false
            };

            let text = JSON.stringify(settings);

            // Act.
            viewModel.pasteSettings(text);

            // Assert.
            assertSettingsEqualViewModel(expectedViewModel, viewModel);
            strict.equal(viewModel.pasteText, ServerSettingsViewModel.appliedPasteText);
            strict.equal(viewModel.saved, false);

            let expected: KeyValueCollectionChangedData = { Type: CollectionChangeType.Add, NewItems: settings };
            hubService.assertMethodCalled('updateServerSettings', expected);
        });

        describe('paste partial', function () {
            for (let testCase of serverSettingsTestCases) {
                it(testCase.property, function () {
                    // Arrange.
                    let services = new ServersPageTestServiceLocator();
                    let mainViewModel: ServersViewModel = services.get(ServersViewModel);
                    let viewModel = mainViewModel.serverSettingsViewModel;
                    let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

                    let expectedViewModel: Partial<ServerSettingsViewModel> = Object.assign({}, ServerSettingsViewModel.formFieldsDefaultValues);
                    expectedViewModel[testCase.property as string] = testCase.value;

                    let settings = {};
                    settings[testCase.property] = testCase.settingValue;

                    let text = JSON.stringify(settings);

                    // Act.
                    viewModel.pasteSettings(text);

                    // Assert.
                    assertSettingsEqualViewModel(expectedViewModel, viewModel);
                    strict.equal(viewModel.pasteText, ServerSettingsViewModel.appliedPasteText);
                    strict.equal(viewModel.saved, false);

                    let expected: KeyValueCollectionChangedData = { Type: CollectionChangeType.Add, NewItems: settings };
                    hubService.assertMethodCalled('updateServerSettings', expected);
                });
            }
        });

        describe('paste with no changes does not trigger update', function () {
            for (let testCase of serverSettingsTestCases) {
                it(testCase.property, function () {
                    // Arrange.
                    let services = new ServersPageTestServiceLocator();
                    let mainViewModel: ServersViewModel = services.get(ServersViewModel);
                    let viewModel = mainViewModel.serverSettingsViewModel;
                    let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

                    let expectedViewModel: Partial<ServerSettingsViewModel> = Object.assign({}, ServerSettingsViewModel.formFieldsDefaultValues);

                    let settings = {};
                    settings[testCase.property] = viewModel[testCase.property];

                    let text = JSON.stringify(settings);

                    // Act.
                    viewModel.pasteSettings(text);

                    // Assert.
                    assertSettingsEqualViewModel(expectedViewModel, viewModel);
                    strict.equal(viewModel.pasteText, ServerSettingsViewModel.appliedPasteText);
                    strict.equal(viewModel.saved, true);

                    hubService.assertMethodNotCalled('updateServerSettings');
                });
            }
        });

        it('paste empty object does not trigger update', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();
            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverSettingsViewModel;
            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let expectedViewModel: Partial<ServerSettingsViewModel> = Object.assign({}, ServerSettingsViewModel.formFieldsDefaultValues);

            let settings = {};
            let text = JSON.stringify(settings);

            // Act.
            viewModel.pasteSettings(text);

            // Assert.
            assertSettingsEqualViewModel(expectedViewModel, viewModel);
            strict.equal(viewModel.pasteText, ServerSettingsViewModel.appliedPasteText);
            strict.equal(viewModel.saved, true);

            hubService.assertMethodNotCalled('updateServerSettings');
        });

        it('parse error shows error', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();
            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverSettingsViewModel;
            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let expectedViewModel: Partial<ServerSettingsViewModel> = Object.assign({}, ServerSettingsViewModel.formFieldsDefaultValues);

            // Act.
            viewModel.pasteSettings('0');

            // Assert.
            assertSettingsEqualViewModel(expectedViewModel, viewModel);
            strict.equal(viewModel.pasteText, ServerSettingsViewModel.errorPasteText);
            strict.equal(viewModel.saved, true);
            hubService.assertMethodNotCalled('updateServerSettings');
        });

        it('not object shows error', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();
            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverSettingsViewModel;
            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let expectedViewModel: Partial<ServerSettingsViewModel> = Object.assign({}, ServerSettingsViewModel.formFieldsDefaultValues);

            // Act.
            viewModel.pasteSettings('text');

            // Assert.
            assertSettingsEqualViewModel(expectedViewModel, viewModel);
            strict.equal(viewModel.pasteText, ServerSettingsViewModel.errorPasteText);
            strict.equal(viewModel.saved, true);
            hubService.assertMethodNotCalled('updateServerSettings');
        });

        it('click reset text after successful paste', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();
            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverSettingsViewModel;

            let settings = {
                AutoPause: false
            };

            let text = JSON.stringify(settings);
            viewModel.pasteSettings(text);
            strict.equal(viewModel.pasteText, ServerSettingsViewModel.appliedPasteText);

            // Act.
            viewModel.pasteSettingsClicked();

            // Assert.
            strict.equal(viewModel.pasteText, ServerSettingsViewModel.normalPasteText);
        });

        it('click reset text after unsuccessful paste', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();
            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverSettingsViewModel;

            let text = JSON.stringify('0');
            viewModel.pasteSettings(text);
            strict.equal(viewModel.pasteText, ServerSettingsViewModel.errorPasteText);

            // Act.
            viewModel.pasteSettingsClicked();

            // Assert.
            strict.equal(viewModel.pasteText, ServerSettingsViewModel.normalPasteText);
        });
    });
});