import { InvokeBase } from "../../testUtils/invokeBase";
import { Observable } from "../../utils/observable";
import { CollectionChangeType } from "../../ts/utils";
import { ObservableProperty } from "../../utils/observableProperty";
import { ServerExtraSettingsViewModel } from "./serverExtraSettingsViewModel";
import { strict } from "assert";
class ServerExtraSettingsServiceMock extends InvokeBase {
    constructor() {
        super(...arguments);
        this._settingsChangedObservable = new Observable();
    }
    static create() {
        return new ServerExtraSettingsServiceMock();
    }
    raiseSettingsChangedObservable(event) {
        this._settingsChangedObservable.raise(event);
    }
    get settings() {
        this.invoked('settings');
        return {};
    }
    get saved() {
        this.invoked('saved');
        return true;
    }
    get settingsChanged() {
        this.invoked('settingsChanged');
        return this._settingsChangedObservable;
    }
    get savedChanged() {
        this.invoked('savedChanged');
        return new ObservableProperty();
    }
    saveSettings(settings) {
        this.invoked('saveSettings', [settings]);
        return Promise.resolve({ Success: true });
    }
    updateSettings(data) {
        this.invoked('updateSettings', data);
    }
    undoSettings() {
        this.invoked('undoSettings');
    }
}
describe('ServerExtraSettingsViewModel', function () {
    function makeServerExtraSettingsViewModel(serverSettingsService) {
        serverSettingsService = serverSettingsService !== null && serverSettingsService !== void 0 ? serverSettingsService : new ServerExtraSettingsServiceMock();
        let copyToClipoardService = {};
        let errorService = {};
        return new ServerExtraSettingsViewModel(serverSettingsService, copyToClipoardService, errorService);
    }
    let serverExtraSettingsTestCases = [
        { property: 'SyncBans', value: false },
        { property: 'BuildBansFromDatabaseOnStart', value: false },
        { property: 'SetDiscordChannelName', value: false },
        { property: 'SetDiscordChannelTopic', value: false },
        { property: 'GameChatToDiscord', value: false },
        { property: 'GameShoutToDiscord', value: false },
        { property: 'DiscordToGameChat', value: false },
        { property: 'PingDiscordCrashRole', value: false }
    ];
    describe('setting form property triggers updates', function () {
        for (let testCase of serverExtraSettingsTestCases) {
            it(testCase.property, function () {
                // Arrange.
                let expectedSettings = {};
                expectedSettings[testCase.property] = testCase.value;
                let expectedUpdateSettings = { Type: CollectionChangeType.Add, NewItems: expectedSettings };
                let actaulUpdateSettings = undefined;
                let serverSettingsServiceMock = new ServerExtraSettingsServiceMock();
                serverSettingsServiceMock.methodCalled.subscribe(event => {
                    if (event.name === 'updateSettings') {
                        actaulUpdateSettings = event.args[0];
                    }
                });
                let serverSettingsViewModel = makeServerExtraSettingsViewModel(serverSettingsServiceMock);
                let actaulPropertyValue = undefined;
                serverSettingsViewModel.propertyChanged(testCase.property, event => actaulPropertyValue = event);
                let saved = serverSettingsViewModel.saved;
                strict.equal(saved, true);
                serverSettingsViewModel.propertyChanged('saved', event => saved = event);
                // Act.
                serverSettingsViewModel[testCase.property] = testCase.value;
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
                let serverSettingsServiceMock = new ServerExtraSettingsServiceMock();
                let updateSettingsCalled = false;
                serverSettingsServiceMock.methodCalled.subscribe(event => {
                    if (event.name === 'updateSettings') {
                        updateSettingsCalled = true;
                    }
                });
                let serverSettingsViewModel = makeServerExtraSettingsViewModel(serverSettingsServiceMock);
                let actaulPropertyValue = undefined;
                serverSettingsViewModel.propertyChanged(testCase.property, event => actaulPropertyValue = event);
                let settings = {};
                settings[testCase.property] = testCase.value;
                let settingsEvent = { Type: CollectionChangeType.Add, NewItems: settings };
                // Act.
                serverSettingsServiceMock.raiseSettingsChangedObservable(settingsEvent);
                // Assert.
                strict.equal(actaulPropertyValue, testCase.value);
                strict.equal(updateSettingsCalled, false);
            });
        }
    });
});
//# sourceMappingURL=serverExtraSettingsViewModel.spec.js.map