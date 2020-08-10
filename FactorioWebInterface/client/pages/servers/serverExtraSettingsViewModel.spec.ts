import { propertyOf } from "../../utils/types";
import { FactorioServerExtraSettings } from "./serversTypes";
import { Result, CollectionChangeType, KeyValueCollectionChangedData } from "../../ts/utils";
import { ServerExtraSettingsViewModel } from "./serverExtraSettingsViewModel";
import { strict } from "assert";
import { ServersPageTestServiceLocator } from "../../testUtils/testServiceLocator";
import { ServersViewModel } from "./serversViewModel";
import { ServersHubService } from "./serversHubService";
import { ServersHubServiceMockBase } from "../../testUtils/pages/servers/serversHubServiceMockBase";
import { PromiseHelper } from "../../utils/promiseHelper";
import { ErrorServiceMockBase } from "../../testUtils/services/errorServiceMockBase";
import { ErrorService } from "../../services/errorService";
import { CopyToClipboardService } from "../../services/copyToClipboardService";
import { CopyToClipboardServiceMockBase } from "../../testUtils/services/copyToClipboardServiceMockBase";
import { ServerSettingsViewModel } from "./serverSettingsViewModel";

describe('ServerExtraSettingsViewModel', function () {
    function assertSettingsEqualViewModel(settings: FactorioServerExtraSettings, viewModel: ServerExtraSettingsViewModel): void {
        strict.equal(settings.BuildBansFromDatabaseOnStart, viewModel.BuildBansFromDatabaseOnStart);
        strict.equal(settings.DiscordToGameChat, viewModel.DiscordToGameChat);
        strict.equal(settings.GameChatToDiscord, viewModel.GameChatToDiscord);
        strict.equal(settings.GameShoutToDiscord, viewModel.GameShoutToDiscord);
        strict.equal(settings.PingDiscordCrashRole, viewModel.PingDiscordCrashRole);
        strict.equal(settings.SetDiscordChannelName, viewModel.SetDiscordChannelName);
        strict.equal(settings.SetDiscordChannelTopic, viewModel.SetDiscordChannelTopic);
        strict.equal(settings.SyncBans, viewModel.SyncBans);
    }

    let serverExtraSettingsTestCases: { property: propertyOf<ServerExtraSettingsViewModel>, value: any }[] = [
        { property: 'SyncBans', value: false },
        { property: 'BuildBansFromDatabaseOnStart', value: false },
        { property: 'SetDiscordChannelName', value: false },
        { property: 'SetDiscordChannelTopic', value: false },
        { property: 'GameChatToDiscord', value: false },
        { property: 'GameShoutToDiscord', value: false },
        { property: 'DiscordToGameChat', value: false },
        { property: 'PingDiscordCrashRole', value: false }
    ];

    describe('starts with default value', function () {
        for (let testCase of serverExtraSettingsTestCases) {
            it(testCase.property, function () {
                // Arrange.          
                let services = new ServersPageTestServiceLocator();
                let mainViewModel: ServersViewModel = services.get(ServersViewModel);

                // Act.
                let viewModel = mainViewModel.serverExtraSettingsViewModel;

                // Assert.                
                let actual = viewModel[testCase.property]
                let expected = ServerExtraSettingsViewModel.formFieldsDefaultValues[testCase.property];
                strict.equal(actual, expected);
            });
        }
    });

    describe('setting null sets to default value', function () {
        for (let testCase of serverExtraSettingsTestCases) {
            it(testCase.property, function () {
                // Arrange.          
                let services = new ServersPageTestServiceLocator();
                let mainViewModel: ServersViewModel = services.get(ServersViewModel);
                let viewModel = mainViewModel.serverExtraSettingsViewModel;
                let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

                let settings = {};
                settings[testCase.property] = null;
                let settingsEvent = { Type: CollectionChangeType.Add, NewItems: settings };

                // Act.
                hubService._onServerExtraSettingsUpdate.raise({ data: settingsEvent, markUnsaved: false });

                // Assert.                
                let actual = viewModel[testCase.property];
                let expected = ServerExtraSettingsViewModel.formFieldsDefaultValues[testCase.property];
                strict.equal(actual, expected);
                strict.equal(viewModel.saved, true);
            });
        }
    });

    describe('updates onServerExtraSettings', function () {
        for (let testCase of serverExtraSettingsTestCases) {
            it(testCase.property, function () {
                // Arrange.          
                let services = new ServersPageTestServiceLocator();
                let mainViewModel: ServersViewModel = services.get(ServersViewModel);
                let viewModel = mainViewModel.serverExtraSettingsViewModel;
                let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

                let settings = {} as FactorioServerExtraSettings;
                for (let prop of serverExtraSettingsTestCases) {
                    settings[prop.property] = prop.value;
                }

                let actaulPropertyValue: any = undefined;
                viewModel.propertyChanged(testCase.property, event => actaulPropertyValue = event);

                // Act.
                hubService._onServerExtraSettings.raise({ settings: settings, saved: false });

                // Assert.
                strict.equal(actaulPropertyValue, testCase.value);
                strict.equal(viewModel.saved, false);
            });
        }
    });

    describe('setting form property triggers updates', function () {
        for (let testCase of serverExtraSettingsTestCases) {
            it(testCase.property, function () {
                // Arrange.
                let services = new ServersPageTestServiceLocator();
                let mainViewModel: ServersViewModel = services.get(ServersViewModel);
                let viewModel = mainViewModel.serverExtraSettingsViewModel;
                let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

                let expectedSettings = {};
                expectedSettings[testCase.property] = testCase.value;
                let expectedUpdateSettings = { Type: CollectionChangeType.Add, NewItems: expectedSettings };

                let actaulUpdateSettings: any = undefined;
                hubService.methodCalled.subscribe(event => {
                    if (event.name === 'updateServerExtraSettings') {
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

    describe('setting from update triggers property', function () {
        for (let testCase of serverExtraSettingsTestCases) {
            it(testCase.property, function () {
                // Arrange.
                let services = new ServersPageTestServiceLocator();
                let mainViewModel: ServersViewModel = services.get(ServersViewModel);
                let viewModel = mainViewModel.serverExtraSettingsViewModel;
                let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

                let actaulPropertyValue = undefined;
                viewModel.propertyChanged(testCase.property, event => actaulPropertyValue = event);

                let settings = {};
                settings[testCase.property] = testCase.value;
                let settingsEvent = { Type: CollectionChangeType.Add, NewItems: settings };

                // Act.
                hubService._onServerExtraSettingsUpdate.raise({ data: settingsEvent, markUnsaved: true });

                // Assert.
                strict.equal(actaulPropertyValue, testCase.value);
                strict.equal(viewModel.saved, false);
                hubService.assertMethodNotCalled('updateServerExtraSettings');
            });
        }
    });

    describe('save command', function () {
        it('can execute', async function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();
            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverExtraSettingsViewModel;
            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            viewModel.BuildBansFromDatabaseOnStart = false;

            let actualSettings: FactorioServerExtraSettings = undefined;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'saveServerExtraSettings') {
                    actualSettings = event.args[0];
                }
            });

            // Act.
            strict.equal(viewModel.saveCommand.canExecute(), true);
            viewModel.saveCommand.execute();
            await PromiseHelper.delay(0);

            // Assert.
            assertSettingsEqualViewModel(actualSettings, viewModel);
        });

        it('can not execute when no unsaved changes', async function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();
            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverExtraSettingsViewModel;
            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            // Act.
            strict.equal(viewModel.saved, true);
            strict.equal(viewModel.saveCommand.canExecute(), false);
            viewModel.saveCommand.execute();
            await PromiseHelper.delay(0);

            // Assert.
            hubService.assertMethodNotCalled('saveServerExtraSettings');
        });

        it('can execute changes when saved changes', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();
            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverExtraSettingsViewModel;

            let canExecuteChangedCalled = false;
            viewModel.saveCommand.canExecuteChanged.subscribe(() => canExecuteChangedCalled = true);

            strict.equal(viewModel.saveCommand.canExecute(), false);

            // Act.
            viewModel.BuildBansFromDatabaseOnStart = false;

            // Assert.
            strict.equal(viewModel.saveCommand.canExecute(), true);
            strict.equal(canExecuteChangedCalled, true);
        });

        class ErrorServersHubServiceMockBase extends ServersHubServiceMockBase {
            _result: Result;

            saveServerExtraSettings(settings: FactorioServerExtraSettings): Promise<Result> {
                this.invoked('saveServerExtraSettings', settings);
                return Promise.resolve(this._result);
            }
        }

        it('reports error', async function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();
            services.register(ServersHubService, () => new ErrorServersHubServiceMockBase());

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverExtraSettingsViewModel;

            let result: Result = { Success: false, Errors: [{ Key: 'some key', Description: 'some description' }] };
            let hubService: ErrorServersHubServiceMockBase = services.get(ServersHubService);
            hubService._result = result;

            let errorService: ErrorServiceMockBase = services.get(ErrorService);

            viewModel.BuildBansFromDatabaseOnStart = false;

            // Act.
            strict.equal(viewModel.saveCommand.canExecute(), true);
            viewModel.saveCommand.execute();
            await PromiseHelper.delay(0);

            // Assert.
            hubService.assertMethodCalled('saveServerExtraSettings');
            errorService.assertMethodCalled('reportIfError', result);
        });
    });

    describe('undo command', function () {
        it('can execute', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();
            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverExtraSettingsViewModel;
            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            viewModel.BuildBansFromDatabaseOnStart = false;

            // Act.
            strict.equal(viewModel.undoCommand.canExecute(), true);
            viewModel.undoCommand.execute();

            // Assert.
            hubService.assertMethodCalled('undoServerExtraSettings');
        });

        it('can not execute when no unsaved changes', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();
            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverExtraSettingsViewModel;
            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            // Act.
            strict.equal(viewModel.saved, true);
            strict.equal(viewModel.undoCommand.canExecute(), false);
            viewModel.undoCommand.execute();

            // Assert.
            hubService.assertMethodNotCalled('undoServerExtraSettings');
        });

        it('can execute changes when saved changes', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();
            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverExtraSettingsViewModel;

            let canExecuteChangedCalled = false;
            viewModel.undoCommand.canExecuteChanged.subscribe(() => canExecuteChangedCalled = true);

            strict.equal(viewModel.undoCommand.canExecute(), false);

            // Act.
            viewModel.BuildBansFromDatabaseOnStart = false;

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
        let viewModel = mainViewModel.serverExtraSettingsViewModel;

        viewModel.GameShoutToDiscord = false;
        viewModel.SetDiscordChannelTopic = false;

        // Act.
        viewModel.copyCommand.execute();

        // Assert.        
        let settings = JSON.parse(actualText);
        assertSettingsEqualViewModel(settings, viewModel);
    });

    describe('paste settings', function () {
        it('starts with normal paste text', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();
            let mainViewModel: ServersViewModel = services.get(ServersViewModel);

            // Act.
            let viewModel = mainViewModel.serverExtraSettingsViewModel;

            // Assert.
            strict.equal(viewModel.pasteText, ServerSettingsViewModel.normalPasteText);
        });

        it('does paste settings', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();
            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverExtraSettingsViewModel;
            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let settings: FactorioServerExtraSettings = {
                SyncBans: false,
                BuildBansFromDatabaseOnStart: false,
                SetDiscordChannelName: false,
                SetDiscordChannelTopic: false,
                GameChatToDiscord: false,
                GameShoutToDiscord: false,
                DiscordToGameChat: false,
                PingDiscordCrashRole: false
            };

            let text = JSON.stringify(settings);

            // Act.
            viewModel.pasteSettings(text);

            // Assert.
            assertSettingsEqualViewModel(settings, viewModel);
            strict.equal(viewModel.pasteText, ServerSettingsViewModel.appliedPasteText);
            strict.equal(viewModel.saved, false);

            let expected: KeyValueCollectionChangedData = { Type: CollectionChangeType.Add, NewItems: settings };
            hubService.assertMethodCalled('updateServerExtraSettings', expected);
        });

        describe('paste partial', function () {
            for (let testCase of serverExtraSettingsTestCases) {
                it(testCase.property, function () {
                    // Arrange.
                    let services = new ServersPageTestServiceLocator();
                    let mainViewModel: ServersViewModel = services.get(ServersViewModel);
                    let viewModel = mainViewModel.serverExtraSettingsViewModel;
                    let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

                    let expectedSettings: FactorioServerExtraSettings = {
                        SyncBans: true,
                        BuildBansFromDatabaseOnStart: true,
                        SetDiscordChannelName: true,
                        SetDiscordChannelTopic: true,
                        GameChatToDiscord: true,
                        GameShoutToDiscord: true,
                        DiscordToGameChat: true,
                        PingDiscordCrashRole: true
                    };
                    expectedSettings[testCase.property] = testCase.value;

                    let settings = {};
                    settings[testCase.property] = testCase.value;

                    let text = JSON.stringify(settings);

                    // Act.
                    viewModel.pasteSettings(text);

                    // Assert.
                    assertSettingsEqualViewModel(expectedSettings, viewModel);
                    strict.equal(viewModel.pasteText, ServerSettingsViewModel.appliedPasteText);
                    strict.equal(viewModel.saved, false);

                    let expected: KeyValueCollectionChangedData = { Type: CollectionChangeType.Add, NewItems: settings };
                    hubService.assertMethodCalled('updateServerExtraSettings', expected);
                });
            }
        });

        it('parse error shows error', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();
            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverExtraSettingsViewModel;
            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let expectedSettings: FactorioServerExtraSettings = {
                SyncBans: true,
                BuildBansFromDatabaseOnStart: true,
                SetDiscordChannelName: true,
                SetDiscordChannelTopic: true,
                GameChatToDiscord: true,
                GameShoutToDiscord: true,
                DiscordToGameChat: true,
                PingDiscordCrashRole: true
            };

            // Act.
            viewModel.pasteSettings('0');

            // Assert.
            assertSettingsEqualViewModel(expectedSettings, viewModel);
            strict.equal(viewModel.pasteText, ServerSettingsViewModel.errorPasteText);
            strict.equal(viewModel.saved, true);
            hubService.assertMethodNotCalled('updateServerExtraSettings');
        });

        it('not object shows error', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();
            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverExtraSettingsViewModel;
            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let expectedSettings: FactorioServerExtraSettings = {
                SyncBans: true,
                BuildBansFromDatabaseOnStart: true,
                SetDiscordChannelName: true,
                SetDiscordChannelTopic: true,
                GameChatToDiscord: true,
                GameShoutToDiscord: true,
                DiscordToGameChat: true,
                PingDiscordCrashRole: true
            };

            // Act.
            viewModel.pasteSettings('text');

            // Assert.
            assertSettingsEqualViewModel(expectedSettings, viewModel);
            strict.equal(viewModel.pasteText, ServerSettingsViewModel.errorPasteText);
            strict.equal(viewModel.saved, true);
            hubService.assertMethodNotCalled('updateServerExtraSettings');
        });

        it('click reset text after successful paste', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();
            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverExtraSettingsViewModel;

            let settings = {
                SyncBans: false
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
            let viewModel = mainViewModel.serverExtraSettingsViewModel;

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