import { strict } from "assert";
import { ServerSettingsViewModel } from "./serverSettingsViewModel";
import { Observable } from "../../utils/observable";
import { CollectionChangeType } from "../../ts/utils";
import { ObservableProperty } from "../../utils/observableProperty";
import { InvokeBase } from "../../testUtils/invokeBase";
class ServerSettingsServiceMock extends InvokeBase {
    constructor() {
        super(...arguments);
        this._settingsChangedObservable = new Observable();
    }
    static create() {
        return new ServerSettingsServiceMock();
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
describe('ServerSettingsViewModel', function () {
    function makeServerSettingsViewModel(serverSettingsService) {
        serverSettingsService = serverSettingsService !== null && serverSettingsService !== void 0 ? serverSettingsService : new ServerSettingsServiceMock();
        let copyToClipoardService = {};
        let errorService = {};
        return new ServerSettingsViewModel(serverSettingsService, copyToClipoardService, errorService);
    }
    let serverSettingsTestCases = [
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
        { property: 'NonBlockingSaving', value: false, settingValue: false },
        { property: 'PublicVisible', value: false, settingValue: false },
    ];
    describe('setting form property triggers updates:', function () {
        for (let testCase of serverSettingsTestCases) {
            it(testCase.property, function () {
                // Arrange.
                let expectedSettings = {};
                expectedSettings[testCase.property] = testCase.settingValue;
                let expectedUpdateSettings = { Type: CollectionChangeType.Add, NewItems: expectedSettings };
                let actaulUpdateSettings = undefined;
                let serverSettingsServiceMock = new ServerSettingsServiceMock();
                serverSettingsServiceMock.methodCalled.subscribe(event => {
                    if (event.name === 'updateSettings') {
                        actaulUpdateSettings = event.args[0];
                    }
                });
                let serverSettingsViewModel = makeServerSettingsViewModel(serverSettingsServiceMock);
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
    describe('setting from update triggers property:', function () {
        for (let testCase of serverSettingsTestCases) {
            it(testCase.property, function () {
                // Arrange.
                let serverSettingsServiceMock = new ServerSettingsServiceMock();
                let updateSettingsCalled = false;
                serverSettingsServiceMock.methodCalled.subscribe(event => {
                    if (event.name === 'updateSettings') {
                        updateSettingsCalled = true;
                    }
                });
                let serverSettingsViewModel = makeServerSettingsViewModel(serverSettingsServiceMock);
                let actaulPropertyValue = undefined;
                serverSettingsViewModel.propertyChanged(testCase.property, event => actaulPropertyValue = event);
                let settings = {};
                settings[testCase.property] = testCase.settingValue;
                let settingsEvent = { Type: CollectionChangeType.Add, NewItems: settings };
                // Act.
                serverSettingsServiceMock.raiseSettingsChangedObservable(settingsEvent);
                // Assert.
                strict.equal(actaulPropertyValue, testCase.value);
                strict.equal(updateSettingsCalled, false);
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
                let serverSettingsViewModel = makeServerSettingsViewModel();
                serverSettingsViewModel.UseDefaultAdmins = !testCase.value;
                let actaulRaised = undefined;
                serverSettingsViewModel.propertyChanged('adminsEditEnabled', event => actaulRaised = event);
                // Act.
                serverSettingsViewModel.UseDefaultAdmins = testCase.value;
                // Assert.
                strict.equal(actaulRaised, testCase.expected);
            });
        }
        for (let testCase of testCases) {
            it(`from settings: ${testCase.value}`, function () {
                // Arrange.
                let serverSettingsServiceMock = new ServerSettingsServiceMock();
                let settings = {};
                settings['UseDefaultAdmins'] = testCase.value;
                let settingsEvent = { Type: CollectionChangeType.Add, NewItems: settings };
                let serverSettingsViewModel = makeServerSettingsViewModel(serverSettingsServiceMock);
                serverSettingsViewModel.UseDefaultAdmins = !testCase.value;
                let actaulRaised = undefined;
                serverSettingsViewModel.propertyChanged('adminsEditEnabled', event => actaulRaised = event);
                // Act.
                serverSettingsServiceMock.raiseSettingsChangedObservable(settingsEvent);
                // Assert.
                strict.equal(actaulRaised, testCase.expected);
            });
        }
    });
});
//# sourceMappingURL=serverSettingsViewModel.spec.js.map