import { strict } from "assert";
import { ServerSettingsViewModel } from "./serverSettingsViewModel";
import { ServerSettingsService } from "./serverSettingsService";
import { FactorioServerSettings } from "./serversTypes";
import { IObservable, Observable } from "../../utils/observable";
import { KeyValueCollectionChangedData, Result, CollectionChangeType } from "../../ts/utils";
import { IObservableProperty, ObservableProperty } from "../../utils/observableProperty";
import { PublicPart, propertyOf } from "../../utils/types";
import { InvokeBase } from "../../testUtils/invokeBase";
import { CopyToClipboardService } from "../../services/copyToClipboardService";
import { ErrorService } from "../../services/errorService";

class ServerSettingsServiceMock extends InvokeBase<ServerSettingsService> implements PublicPart<ServerSettingsService> {
    static create(): ServerSettingsService {
        return new ServerSettingsServiceMock() as any as ServerSettingsService;
    }

    private _settingsChangedObservable = new Observable<KeyValueCollectionChangedData<any>>();

    raiseSettingsChangedObservable(event: KeyValueCollectionChangedData<any>) {
        this._settingsChangedObservable.raise(event);
    }

    get settings(): FactorioServerSettings {
        this.invoked('settings');
        return {} as FactorioServerSettings;
    }
    get saved(): boolean {
        this.invoked('saved');
        return true;
    }
    get settingsChanged(): IObservable<KeyValueCollectionChangedData<any>> {
        this.invoked('settingsChanged');
        return this._settingsChangedObservable;
    }
    get savedChanged(): IObservableProperty<boolean> {
        this.invoked('savedChanged');
        return new ObservableProperty();
    }
    saveSettings(settings: FactorioServerSettings): Promise<Result> {
        this.invoked('saveSettings', [settings]);
        return Promise.resolve({ Success: true });
    }
    updateSettings(data: KeyValueCollectionChangedData<any>): void {
        this.invoked('updateSettings', data);
    }
    undoSettings(): void {
        this.invoked('undoSettings');
    }
}

describe('ServerSettingsViewModel', function () {
    function makeServerSettingsViewModel(serverSettingsService?: ServerSettingsService): ServerSettingsViewModel {
        serverSettingsService = serverSettingsService ?? (new ServerSettingsServiceMock() as any as ServerSettingsService);
        let copyToClipoardService = {} as CopyToClipboardService;
        let errorService = {} as ErrorService;

        return new ServerSettingsViewModel(serverSettingsService, copyToClipoardService, errorService)
    }

    let serverSettingsTestCases: { property: propertyOf<ServerSettingsViewModel>, value: any, settingValue: any }[] = [
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

    describe('setting form property triggers updates', function () {
        for (let testCase of serverSettingsTestCases) {
            it(testCase.property, function () {
                // Arrange.
                let expectedSettings = {};
                expectedSettings[testCase.property] = testCase.settingValue;
                let expectedUpdateSettings = { Type: CollectionChangeType.Add, NewItems: expectedSettings };

                let actaulUpdateSettings: any = undefined;

                let serverSettingsServiceMock = new ServerSettingsServiceMock();
                serverSettingsServiceMock.methodCalled.subscribe(event => {
                    if (event.name === 'updateSettings') {
                        actaulUpdateSettings = event.args[0];
                    }
                });

                let serverSettingsViewModel = makeServerSettingsViewModel(serverSettingsServiceMock as any as ServerSettingsService);

                let actaulPropertyValue: any = undefined;
                serverSettingsViewModel.propertyChanged(testCase.property, event => actaulPropertyValue = event);

                let saved = serverSettingsViewModel.saved;
                strict.equal(saved, true);
                serverSettingsViewModel.propertyChanged('saved', event => saved = event);

                // Act.
                serverSettingsViewModel[testCase.property as string] = testCase.value;

                // Assert.            
                strict.equal(actaulPropertyValue, testCase.value);
                strict.deepEqual(actaulUpdateSettings, expectedUpdateSettings);
                strict.equal(saved, false);
            });
        }
    });

    describe('setting from update triggers property', function () {
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

                let serverSettingsViewModel = makeServerSettingsViewModel(serverSettingsServiceMock as any as ServerSettingsService);

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

                let serverSettingsViewModel = makeServerSettingsViewModel(serverSettingsServiceMock as any as ServerSettingsService);
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