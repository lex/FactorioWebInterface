import { InvokeBase } from "../../testUtils/invokeBase";
import { ServerExtraSettingsService } from "./serverExtraSettingsService";
import { PublicPart, propertyOf } from "../../utils/types";
import { FactorioServerExtraSettings } from "./serversTypes";
import { IObservable, Observable } from "../../utils/observable";
import { KeyValueCollectionChangedData, Result, CollectionChangeType } from "../../ts/utils";
import { IObservableProperty, ObservableProperty } from "../../utils/observableProperty";
import { ServerExtraSettingsViewModel } from "./serverExtraSettingsViewModel";
import { CopyToClipboardService } from "../../services/copyToClipboardService";
import { ErrorService } from "../../services/errorService";
import { strict } from "assert";

class ServerExtraSettingsServiceMock extends InvokeBase<ServerExtraSettingsService> implements PublicPart<ServerExtraSettingsService>{
    static create(): ServerExtraSettingsService {
        return new ServerExtraSettingsServiceMock() as any as ServerExtraSettingsService;
    }

    private _settingsChangedObservable = new Observable<KeyValueCollectionChangedData<any>>();

    raiseSettingsChangedObservable(event: KeyValueCollectionChangedData<any>) {
        this._settingsChangedObservable.raise(event);
    }

    get settings(): FactorioServerExtraSettings {
        this.invoked('settings');
        return {} as FactorioServerExtraSettings;
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
    saveSettings(settings: FactorioServerExtraSettings): Promise<Result<void>> {
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

describe('ServerExtraSettingsViewModel', function () {
    function makeServerExtraSettingsViewModel(serverSettingsService?: ServerExtraSettingsService): ServerExtraSettingsViewModel {
        serverSettingsService = serverSettingsService ?? (new ServerExtraSettingsServiceMock() as any as ServerExtraSettingsService);
        let copyToClipoardService = {} as CopyToClipboardService;
        let errorService = {} as ErrorService;

        return new ServerExtraSettingsViewModel(serverSettingsService, copyToClipoardService, errorService)
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

    describe('setting form property triggers updates', function () {
        for (let testCase of serverExtraSettingsTestCases) {
            it(testCase.property, function () {
                // Arrange.
                let expectedSettings = {};
                expectedSettings[testCase.property] = testCase.value;
                let expectedUpdateSettings = { Type: CollectionChangeType.Add, NewItems: expectedSettings };

                let actaulUpdateSettings: any = undefined;

                let serverSettingsServiceMock = new ServerExtraSettingsServiceMock();
                serverSettingsServiceMock.methodCalled.subscribe(event => {
                    if (event.name === 'updateSettings') {
                        actaulUpdateSettings = event.args[0];
                    }
                });

                let serverSettingsViewModel = makeServerExtraSettingsViewModel(serverSettingsServiceMock as any as ServerExtraSettingsService);

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

                let serverSettingsViewModel = makeServerExtraSettingsViewModel(serverSettingsServiceMock as any as ServerExtraSettingsService);

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