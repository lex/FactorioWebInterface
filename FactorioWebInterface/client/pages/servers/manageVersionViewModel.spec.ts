import { ManageVersionViewModel } from "./manageVersionViewModel";
import { ServersPageTestServiceLocator } from "../../testUtils/testServiceLocator";
import { ManageVersionService } from "./manageVersionService";
import { ErrorService } from "../../services/errorService";
import { ServerConsoleService } from "./serverConsoleService";
import { ServersHubServiceMockBase } from "../../testUtils/pages/servers/serversHubServiceMockBase";
import { ServersHubService } from "./serversHubService";
import { strict } from "assert";
import { CollectionChangeType, Result } from "../../ts/utils";
import { IterableHelper } from "../../utils/iterableHelper";
import { PromiseHelper } from "../../utils/promiseHelper";
import { FactorioServerStatus } from "./serversTypes";
import { ErrorServiceMockBase } from "../../testUtils/services/errorServiceMockBase";

describe('ManageVersionViewModel', function () {
    const cachedVersions = [
        '0.0.0',
        '0.0.1',
        '0.2.0',
    ];

    const downloadabledVersions = [
        '0.0.1',
        '0.2.0',
        '0.3.0',
    ];

    class ErrorServersHubServiceMockBase extends ServersHubServiceMockBase {
        _result: Result;

        update(version: string): Promise<Result> {
            this.invoked('update', version);
            return Promise.resolve(this._result);
        }
    }

    it('can construct', function () {
        // Arrange.          
        let services = new ServersPageTestServiceLocator();
        let manageVersionService: ManageVersionService = services.get(ManageVersionService);
        let serverConsoleService: ServerConsoleService = services.get(ServerConsoleService);
        let errorService: ErrorServiceMockBase = services.get(ErrorService);

        let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
        hubService._onCachedVersions.raise({ Type: CollectionChangeType.Reset, NewItems: cachedVersions });
        hubService._onDownloadableVersions.raise(downloadabledVersions);

        // Act.
        let viewModel = new ManageVersionViewModel(manageVersionService, serverConsoleService.status, errorService);

        // Assert.
        strict.deepEqual([...viewModel.cachedVersions], ['0.2.0', '0.0.1', '0.0.0']);
        strict.deepEqual([...viewModel.downloadableVersions], ['0.3.0', '0.2.0', '0.0.1', 'latest']);
        strict.equal(viewModel.isFetchingVersions.value, true);
        strict.equal(viewModel.updateTooltip, null);
    });

    it('request versions', function () {
        // Arrange.          
        let services = new ServersPageTestServiceLocator();
        let manageVersionService: ManageVersionService = services.get(ManageVersionService);
        let serverConsoleService: ServerConsoleService = services.get(ServerConsoleService);
        let errorService: ErrorServiceMockBase = services.get(ErrorService);

        let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

        // Act.
        let viewModel = new ManageVersionViewModel(manageVersionService, serverConsoleService.status, errorService);

        // Assert.
        hubService.assertMethodCalled('requestCachedVersions');
        hubService.assertMethodCalled('requestDownloadableVersions');
    });

    it('update tooltip shown when update disabled', function () {
        // Arrange.          
        let services = new ServersPageTestServiceLocator();
        let manageVersionService: ManageVersionService = services.get(ManageVersionService);
        let serverConsoleService: ServerConsoleService = services.get(ServerConsoleService);
        let errorService: ErrorServiceMockBase = services.get(ErrorService);
        let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

        let viewModel = new ManageVersionViewModel(manageVersionService, serverConsoleService.status, errorService);
        strict.equal(viewModel.updateTooltip, null);

        let updateTooltipPropertyChangedCalled = false;
        viewModel.propertyChanged('updateTooltip', event => {
            updateTooltipPropertyChangedCalled = true;
        })

        // Act.
        hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Running, oldStatus: FactorioServerStatus.Unknown });

        // Assert.
        strict.equal(viewModel.updateTooltip, ManageVersionViewModel.updateDisabledTooltipMessage);
        strict.equal(updateTooltipPropertyChangedCalled, true);
    });

    it('fetching versions updates', function () {
        // Arrange.          
        let services = new ServersPageTestServiceLocator();
        let manageVersionService: ManageVersionService = services.get(ManageVersionService);
        let serverConsoleService: ServerConsoleService = services.get(ServerConsoleService);
        let errorService: ErrorServiceMockBase = services.get(ErrorService);

        let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

        let viewModel = new ManageVersionViewModel(manageVersionService, serverConsoleService.status, errorService);
        strict.equal(viewModel.isFetchingVersions.value, true);

        // Act.
        hubService._onDownloadableVersions.raise(downloadabledVersions);

        // Assert.
        strict.equal(viewModel.isFetchingVersions.value, false);
    });

    it('shows latest downloadable version', function () {
        // Arrange.          
        let services = new ServersPageTestServiceLocator();
        let manageVersionService: ManageVersionService = services.get(ManageVersionService);
        let serverConsoleService: ServerConsoleService = services.get(ServerConsoleService);
        let errorService: ErrorServiceMockBase = services.get(ErrorService);

        // Act.
        let viewModel = new ManageVersionViewModel(manageVersionService, serverConsoleService.status, errorService);

        // Assert.        
        strict.deepEqual([...viewModel.downloadableVersions], [ManageVersionService.latestVersion]);

        // With other versions
        let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
        hubService._onDownloadableVersions.raise(downloadabledVersions);

        // Assert.        
        strict.equal(IterableHelper.any(viewModel.downloadableVersions, x => x === ManageVersionService.latestVersion), true);
    });

    describe('download and update command', function () {
        it('can execute', async function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();
            let manageVersionService: ManageVersionService = services.get(ManageVersionService);
            let serverConsoleService: ServerConsoleService = services.get(ServerConsoleService);
            let errorService: ErrorServiceMockBase = services.get(ErrorService);

            let viewModel = new ManageVersionViewModel(manageVersionService, serverConsoleService.status, errorService);
            let closedCalled = false;
            viewModel.closeObservable.subscribe(() => closedCalled = true);

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._onDownloadableVersions.raise(downloadabledVersions);

            // Act.
            strict.equal(viewModel.downloadAndUpdateCommand.canExecute(), true);
            viewModel.downloadAndUpdateCommand.execute();
            await PromiseHelper.delay(0);

            // Assert.
            let selected = [...viewModel.downloadableVersions.selected][0];
            hubService.assertMethodCalled('update', selected);

            strict.equal(closedCalled, true);
            errorService.assertNoErrorsReported();
        });

        it('can not execute when server is running', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();
            let manageVersionService: ManageVersionService = services.get(ManageVersionService);
            let serverConsoleService: ServerConsoleService = services.get(ServerConsoleService);
            let errorService: ErrorServiceMockBase = services.get(ErrorService);

            let viewModel = new ManageVersionViewModel(manageVersionService, serverConsoleService.status, errorService);
            let closedCalled = false;
            viewModel.closeObservable.subscribe(() => closedCalled = true);

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._onDownloadableVersions.raise(downloadabledVersions);
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Running, oldStatus: FactorioServerStatus.Unknown });

            // Act.
            strict.equal(viewModel.downloadAndUpdateCommand.canExecute(), false);
            viewModel.downloadAndUpdateCommand.execute();

            // Assert.
            hubService.assertMethodNotCalled('update');
            strict.equal(closedCalled, false);
            errorService.assertNoErrorsReported();
        });

        it('updates when server status changes', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();
            let manageVersionService: ManageVersionService = services.get(ManageVersionService);
            let serverConsoleService: ServerConsoleService = services.get(ServerConsoleService);
            let errorService: ErrorServiceMockBase = services.get(ErrorService);

            let viewModel = new ManageVersionViewModel(manageVersionService, serverConsoleService.status, errorService);

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._onDownloadableVersions.raise(downloadabledVersions);

            let canExecuteChangedCalled = false;
            viewModel.downloadAndUpdateCommand.canExecuteChanged.subscribe(() => canExecuteChangedCalled = true);

            // Act.
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Running, oldStatus: FactorioServerStatus.Unknown });

            // Assert.            
            strict.equal(canExecuteChangedCalled, true);
        });

        it('reports error', async function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();
            services.register(ServersHubService, () => new ErrorServersHubServiceMockBase());

            let manageVersionService: ManageVersionService = services.get(ManageVersionService);
            let serverConsoleService: ServerConsoleService = services.get(ServerConsoleService);
            let errorService: ErrorServiceMockBase = services.get(ErrorService);

            let viewModel = new ManageVersionViewModel(manageVersionService, serverConsoleService.status, errorService);
            let closedCalled = false;
            viewModel.closeObservable.subscribe(() => closedCalled = true);

            let hubService: ErrorServersHubServiceMockBase = services.get(ServersHubService);
            hubService._onDownloadableVersions.raise(downloadabledVersions);

            let result: Result = { Success: false, Errors: [{ Key: 'some error', Description: 'some description' }] };
            hubService._result = result;

            // Act.
            strict.equal(viewModel.downloadAndUpdateCommand.canExecute(), true);
            viewModel.downloadAndUpdateCommand.execute();
            await PromiseHelper.delay(0);

            // Assert.
            hubService.assertMethodCalled('update');
            strict.equal(closedCalled, false);
            errorService.assertMethodCalled('reportIfError', result);
        });
    });

    describe('update command', function () {
        it('can execute', async function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();
            let manageVersionService: ManageVersionService = services.get(ManageVersionService);
            let serverConsoleService: ServerConsoleService = services.get(ServerConsoleService);
            let errorService: ErrorServiceMockBase = services.get(ErrorService);

            let viewModel = new ManageVersionViewModel(manageVersionService, serverConsoleService.status, errorService);
            let closedCalled = false;
            viewModel.closeObservable.subscribe(() => closedCalled = true);

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._onCachedVersions.raise({ Type: CollectionChangeType.Reset, NewItems: cachedVersions });

            let version = cachedVersions[1];

            // Act.
            strict.equal(viewModel.updateCommand.canExecute(version), true);
            viewModel.updateCommand.execute(version);
            await PromiseHelper.delay(0);

            // Assert.            
            hubService.assertMethodCalled('update', version);
            strict.equal(closedCalled, true);
            errorService.assertNoErrorsReported();
        });

        it('can not execute when server is running', async function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();
            let manageVersionService: ManageVersionService = services.get(ManageVersionService);
            let serverConsoleService: ServerConsoleService = services.get(ServerConsoleService);
            let errorService: ErrorServiceMockBase = services.get(ErrorService);

            let viewModel = new ManageVersionViewModel(manageVersionService, serverConsoleService.status, errorService);
            let closedCalled = false;
            viewModel.closeObservable.subscribe(() => closedCalled = true);

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._onCachedVersions.raise({ Type: CollectionChangeType.Reset, NewItems: cachedVersions });
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Running, oldStatus: FactorioServerStatus.Unknown });

            let version = cachedVersions[1];

            // Act.
            strict.equal(viewModel.updateCommand.canExecute(version), false);
            viewModel.updateCommand.execute(version);

            // Assert.            
            hubService.assertMethodNotCalled('update');
            strict.equal(closedCalled, false);
            errorService.assertNoErrorsReported();
        });

        it('updates when server status changes', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();
            let manageVersionService: ManageVersionService = services.get(ManageVersionService);
            let serverConsoleService: ServerConsoleService = services.get(ServerConsoleService);
            let errorService: ErrorServiceMockBase = services.get(ErrorService);

            let viewModel = new ManageVersionViewModel(manageVersionService, serverConsoleService.status, errorService);

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._onCachedVersions.raise({ Type: CollectionChangeType.Reset, NewItems: cachedVersions });

            let canExecuteChangedCalled = false;
            viewModel.updateCommand.canExecuteChanged.subscribe(() => canExecuteChangedCalled = true);

            // Act.
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Running, oldStatus: FactorioServerStatus.Unknown });

            // Assert.            
            strict.equal(canExecuteChangedCalled, true);
        });

        it('reports error', async function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();
            services.register(ServersHubService, () => new ErrorServersHubServiceMockBase());

            let manageVersionService: ManageVersionService = services.get(ManageVersionService);
            let serverConsoleService: ServerConsoleService = services.get(ServerConsoleService);
            let errorService: ErrorServiceMockBase = services.get(ErrorService);

            let viewModel = new ManageVersionViewModel(manageVersionService, serverConsoleService.status, errorService);
            let closedCalled = false;
            viewModel.closeObservable.subscribe(() => closedCalled = true);

            let hubService: ErrorServersHubServiceMockBase = services.get(ServersHubService);
            hubService._onCachedVersions.raise({ Type: CollectionChangeType.Reset, NewItems: cachedVersions });
            let version = cachedVersions[1];

            let result: Result = { Success: false, Errors: [{ Key: 'some error', Description: 'some description' }] };
            hubService._result = result;

            // Act.
            strict.equal(viewModel.updateCommand.canExecute(version), true);
            viewModel.updateCommand.execute(version);
            await PromiseHelper.delay(0);

            // Assert.            
            hubService.assertMethodCalled('update', version);
            strict.equal(closedCalled, false);
            errorService.assertMethodCalled('reportIfError', result);
        });
    });

    describe('delete command', function () {
        it('can execute', async function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();
            let manageVersionService: ManageVersionService = services.get(ManageVersionService);
            let serverConsoleService: ServerConsoleService = services.get(ServerConsoleService);
            let errorService: ErrorServiceMockBase = services.get(ErrorService);

            let viewModel = new ManageVersionViewModel(manageVersionService, serverConsoleService.status, errorService);
            let closedCalled = false;
            viewModel.closeObservable.subscribe(() => closedCalled = true);

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._onCachedVersions.raise({ Type: CollectionChangeType.Reset, NewItems: cachedVersions });

            let version = cachedVersions[1];

            // Act.
            strict.equal(viewModel.deleteCommand.canExecute(version), true);
            viewModel.deleteCommand.execute(version);
            await PromiseHelper.delay(0);

            // Assert.            
            hubService.assertMethodCalled('deleteCachedVersion', version);
            strict.equal(closedCalled, false);
            errorService.assertNoErrorsReported();
        });
    });
});