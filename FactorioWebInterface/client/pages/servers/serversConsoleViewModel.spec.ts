import { strict } from "assert";
import { ServersPageTestServiceLocator } from "../../testUtils/testServiceLocator";
import { ServersViewModel } from "./serversViewModel";
import { ServersHubService } from "./serversHubService";
import { ServersHubServiceMockBase } from "../../testUtils/pages/servers/serversHubServiceMockBase";
import { CollectionChangeType, CollectionChangedData } from "../../ts/utils";
import { FileMetaData, FactorioServerStatus, ScenarioMetaData, MessageData, MessageType, FactorioControlClientData, FactorioServerSettings } from "./serversTypes";
import { PromiseHelper } from "../../utils/promiseHelper";
import { ServersConsoleViewModel } from "./serversConsoleViewModel";

const tempFile: FileMetaData = {
    Name: 'file.zip',
    Size: 0,
    Directory: 'temp_saves',
    CreatedTime: '2020-01-01 00:00:00',
    LastModifiedTime: '2020-01-01 00:00:00'
};

const tempFile2: FileMetaData = {
    Name: 'file2.zip',
    Size: 0,
    Directory: 'temp_saves',
    CreatedTime: '2020-01-01 00:00:00',
    LastModifiedTime: '2020-01-02 00:00:00'
};

const localFile: FileMetaData = {
    Name: 'local_file.zip',
    Size: 0,
    Directory: 'local_saves',
    CreatedTime: '2020-01-01 00:00:00',
    LastModifiedTime: '2020-01-01 00:00:00'
}

const localFile2: FileMetaData = {
    Name: 'local_file2.zip',
    Size: 0,
    Directory: 'local_saves',
    CreatedTime: '2020-01-01 00:00:00',
    LastModifiedTime: '2020-01-01 00:00:00'
}

const globalFile: FileMetaData = {
    Name: 'global_file.zip',
    Size: 0,
    Directory: 'global_saves',
    CreatedTime: '2020-01-01 00:00:00',
    LastModifiedTime: '2020-01-01 00:00:00'
}

const globalFile2: FileMetaData = {
    Name: 'global_file2.zip',
    Size: 0,
    Directory: 'global_saves',
    CreatedTime: '2020-01-01 00:00:00',
    LastModifiedTime: '2020-01-01 00:00:00'
}

const scenario: ScenarioMetaData = {
    Name: 'scenario',
    CreatedTime: '2020-01-01 00:00:00',
    LastModifiedTime: '2020-01-01 00:00:00'
}

const scenario2: ScenarioMetaData = {
    Name: 'scenario2',
    CreatedTime: '2020-01-01 00:00:00',
    LastModifiedTime: '2020-01-01 00:00:00'
}

const logFile: FileMetaData = {
    Name: 'log.log',
    Size: 0,
    Directory: 'logs',
    CreatedTime: '2020-01-01 00:00:00',
    LastModifiedTime: '2020-01-01 00:00:00'
}

const chatLogFile: FileMetaData = {
    Name: 'chatlog.log',
    Size: 0,
    Directory: 'chat_logs',
    CreatedTime: '2020-01-01 00:00:00',
    LastModifiedTime: '2020-01-01 00:00:00'
}

describe('ServerConsoleViewModel', function () {
    describe('resume command', function () {
        it('can execute when server is startable and there is a temp file.', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let resumeCalled = false;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'resume') {
                    resumeCalled = true;
                }
            });

            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            // Act.
            viewModel.resumeCommand.execute();

            // Assert.
            strict.equal(resumeCalled, true);
            strict.equal(viewModel.resumeCommand.canExecute(), true);
        });

        it('can not execute when server is running.', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let resumeCalled = false;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'resume') {
                    resumeCalled = true;
                }
            });

            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Running, oldStatus: FactorioServerStatus.Unknown });

            // Act.
            viewModel.resumeCommand.execute();

            // Assert.
            strict.equal(resumeCalled, false);
            strict.equal(viewModel.resumeCommand.canExecute(), false);
        });

        it('can not execute when no temp file.', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let resumeCalled = false;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'resume') {
                    resumeCalled = true;
                }
            });

            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [] });

            // Act.
            viewModel.resumeCommand.execute();

            // Assert.
            strict.equal(resumeCalled, false);
            strict.equal(viewModel.resumeCommand.canExecute(), false);
        });

        let testCases = [
            {
                name: 'status',
                act: (hubService: ServersHubServiceMockBase) => hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown })
            },
            {
                name: 'temp files',
                act: (hubService: ServersHubServiceMockBase) => hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] })
            },
        ]

        for (let testCase of testCases) {
            it(`canExecuteChanged raised: ${testCase.name}.`, function () {
                // Arrange.          
                let services = new ServersPageTestServiceLocator();

                let mainViewModel: ServersViewModel = services.get(ServersViewModel);
                let viewModel = mainViewModel.serverConsoleViewModel;

                let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

                let raised = false;
                viewModel.resumeCommand.canExecuteChanged.subscribe(() => raised = true);

                // Act.
                testCase.act(hubService);

                // Assert.
                strict.equal(raised, true);
            });
        }
    });

    describe('load command', function () {
        it('can execute when server is startable and there is a single selected file.', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let actualDirectory = undefined;
            let actualFile = undefined;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'load') {
                    actualDirectory = event.args[0];
                    actualFile = event.args[1];
                }
            });

            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            let tempFiles = mainViewModel.tempFileViewModel.files;
            tempFiles.setSingleSelected(tempFiles.getBoxByKey(tempFile.Name));

            // Act.
            viewModel.loadCommand.execute();

            // Assert.
            strict.equal(actualDirectory, tempFile.Directory);
            strict.equal(actualFile, tempFile.Name);
            strict.equal(viewModel.loadCommand.canExecute(), true);
        });

        it('can not execute when server is running.', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let actualDirectory = undefined;
            let actualFile = undefined;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'load') {
                    actualDirectory = event.args[0];
                    actualFile = event.args[1];
                }
            });

            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Running, oldStatus: FactorioServerStatus.Unknown });
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            let tempFiles = mainViewModel.tempFileViewModel.files;
            tempFiles.setSingleSelected(tempFiles.getBoxByKey(tempFile.Name));

            // Act.
            viewModel.loadCommand.execute();

            // Assert.
            strict.equal(actualDirectory, undefined);
            strict.equal(actualFile, undefined);
            strict.equal(viewModel.loadCommand.canExecute(), false);
        });

        it('can not execute when no selected file.', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let actualDirectory = undefined;
            let actualFile = undefined;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'load') {
                    actualDirectory = event.args[0];
                    actualFile = event.args[1];
                }
            });

            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });

            // Act.
            viewModel.loadCommand.execute();

            // Assert.
            strict.equal(actualDirectory, undefined);
            strict.equal(actualFile, undefined);
            strict.equal(viewModel.loadCommand.canExecute(), false);
        });

        it('can not execute when mutliple selected files.', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let actualDirectory = undefined;
            let actualFile = undefined;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'load') {
                    actualDirectory = event.args[0];
                    actualFile = event.args[1];
                }
            });

            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile, tempFile2] });

            let tempFiles = mainViewModel.tempFileViewModel.files;
            tempFiles.selectAll();

            // Act.
            viewModel.loadCommand.execute();

            // Assert.
            strict.equal(actualDirectory, undefined);
            strict.equal(actualFile, undefined);
            strict.equal(viewModel.loadCommand.canExecute(), false);
        });

        it('canExecuteChanged raised: status.', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let raised = false;
            viewModel.loadCommand.canExecuteChanged.subscribe(() => raised = true);

            // Act.
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });

            // Assert.
            strict.equal(raised, true);
        });

        it('canExecuteChanged raised: file selected.', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });
            let tempFiles = mainViewModel.tempFileViewModel.files;

            let raised = false;
            viewModel.loadCommand.canExecuteChanged.subscribe(() => raised = true);

            // Act.
            tempFiles.selectAll();

            // Assert.
            strict.equal(raised, true);
        });

        let loadTestCases = [
            {
                name: 'temp',
                expected: tempFile,
                act: (vm: ServersViewModel) => {
                    let files = vm.tempFileViewModel.files;
                    files.setSingleSelected(files.getBoxByKey(tempFile.Name));
                }
            },
            {
                name: 'temp2',
                expected: tempFile2,
                act: (vm: ServersViewModel) => {
                    let files = vm.tempFileViewModel.files;
                    files.setSingleSelected(files.getBoxByKey(tempFile2.Name));
                }
            },
            {
                name: 'local',
                expected: localFile,
                act: (vm: ServersViewModel) => {
                    let files = vm.localFileViewModel.files;
                    files.setSingleSelected(files.getBoxByKey(localFile.Name));
                }
            },
            {
                name: 'global',
                expected: globalFile,
                act: (vm: ServersViewModel) => {
                    let files = vm.globalFileViewModel.files;
                    files.setSingleSelected(files.getBoxByKey(globalFile.Name));
                }
            }
        ]

        for (let testCase of loadTestCases) {
            it(`loads the selected save: ${testCase.name}`, function () {
                // Arrange.          
                let services = new ServersPageTestServiceLocator();

                let mainViewModel: ServersViewModel = services.get(ServersViewModel);
                let viewModel = mainViewModel.serverConsoleViewModel;

                let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

                let actualDirectory = undefined;
                let actualFile = undefined;
                hubService.methodCalled.subscribe(event => {
                    if (event.name === 'load') {
                        actualDirectory = event.args[0];
                        actualFile = event.args[1];
                    }
                });

                hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });
                hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile, tempFile2] });
                hubService._localSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [localFile, localFile2] });
                hubService._globalSaveFiles.raise({ Type: CollectionChangeType.Reset, NewItems: [globalFile, globalFile2] });

                testCase.act(mainViewModel);

                // Act.
                viewModel.loadCommand.execute();

                // Assert.
                strict.equal(actualDirectory, testCase.expected.Directory);
                strict.equal(actualFile, testCase.expected.Name);
            });
        }
    });

    describe('start scenario command', function () {
        it('can execute when server is startable and there is a single scenario selected.', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let actualScenario = undefined;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'startScenario') {
                    actualScenario = event.args[0];
                }
            });

            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });
            hubService._scenarios.raise({ Type: CollectionChangeType.Reset, NewItems: [scenario] });

            let scenarios = mainViewModel.scenariosViewModel.scenarios;
            scenarios.setSingleSelected(scenarios.getBoxByKey(scenario.Name));

            // Act.
            viewModel.startScenarioCommand.execute();

            // Assert.
            strict.equal(actualScenario, scenario.Name);
            strict.equal(viewModel.startScenarioCommand.canExecute(), true);
        });

        it('can not execute when server is running.', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let actualScenario = undefined;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'startScenario') {
                    actualScenario = event.args[0];
                }
            });

            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Running, oldStatus: FactorioServerStatus.Unknown });
            hubService._scenarios.raise({ Type: CollectionChangeType.Reset, NewItems: [scenario] });

            let scenarios = mainViewModel.scenariosViewModel.scenarios;
            scenarios.setSingleSelected(scenarios.getBoxByKey(scenario.Name));

            // Act.
            viewModel.startScenarioCommand.execute();

            // Assert.
            strict.equal(actualScenario, undefined);
            strict.equal(viewModel.startScenarioCommand.canExecute(), false);
        });

        it('can not execute when no selected scenario.', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let actualScenario = undefined;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'startScenario') {
                    actualScenario = event.args[0];
                }
            });

            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });
            hubService._scenarios.raise({ Type: CollectionChangeType.Reset, NewItems: [scenario] });

            // Act.
            viewModel.startScenarioCommand.execute();

            // Assert.
            strict.equal(actualScenario, undefined);
            strict.equal(viewModel.startScenarioCommand.canExecute(), false);
        });

        it('can not execute when multiple scenarios selected.', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let actualScenario = undefined;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'startScenario') {
                    actualScenario = event.args[0];
                }
            });

            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });
            hubService._scenarios.raise({ Type: CollectionChangeType.Reset, NewItems: [scenario, scenario2] });

            mainViewModel.scenariosViewModel.scenarios.selectAll();

            // Act.
            viewModel.startScenarioCommand.execute();

            // Assert.
            strict.equal(actualScenario, undefined);
            strict.equal(viewModel.startScenarioCommand.canExecute(), false);
        });

        it('canExecuteChanged raised: status.', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let raised = false;
            viewModel.startScenarioCommand.canExecuteChanged.subscribe(() => raised = true);

            // Act.
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });

            // Assert.
            strict.equal(raised, true);
        });

        it('canExecuteChanged raised: scenario selected.', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            hubService._scenarios.raise({ Type: CollectionChangeType.Reset, NewItems: [scenario] });
            let scenarios = mainViewModel.scenariosViewModel.scenarios;

            let raised = false;
            viewModel.startScenarioCommand.canExecuteChanged.subscribe(() => raised = true);

            // Act.
            scenarios.setSingleSelected(scenarios.getBoxByKey(scenario.Name));

            // Assert.
            strict.equal(raised, true);
        });

        let scenarioTestCases = [
            {
                name: 'scenario',
                scenario: scenario
            },
            {
                name: 'scenario2',
                scenario: scenario2
            }
        ];

        for (let testCase of scenarioTestCases) {
            it(`starts the selected scenario ${testCase.name}`, function () {
                // Arrange.          
                let services = new ServersPageTestServiceLocator();

                let mainViewModel: ServersViewModel = services.get(ServersViewModel);
                let viewModel = mainViewModel.serverConsoleViewModel;

                let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

                let actualScenario = undefined;
                hubService.methodCalled.subscribe(event => {
                    if (event.name === 'startScenario') {
                        actualScenario = event.args[0];
                    }
                });

                hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });
                hubService._scenarios.raise({ Type: CollectionChangeType.Reset, NewItems: [scenario, scenario2] });

                let scenarios = mainViewModel.scenariosViewModel.scenarios;
                scenarios.setSingleSelected(scenarios.getBoxByKey(testCase.scenario.Name));

                // Act.
                viewModel.startScenarioCommand.execute();

                // Assert.
                strict.equal(actualScenario, testCase.scenario.Name);
            });
        }
    });

    describe('save command', function () {
        it('can execute when server is running', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let saveRaised = undefined;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'save') {
                    saveRaised = true;
                }
            });

            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Running, oldStatus: FactorioServerStatus.Unknown });

            // Act.
            viewModel.saveCommand.execute();

            // Assert.
            strict.equal(saveRaised, true);
            strict.equal(viewModel.saveCommand.canExecute(), true);
        });

        it('can not execute when server is not running', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let saveRaised = undefined;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'save') {
                    saveRaised = true;
                }
            });

            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });

            // Act.
            viewModel.saveCommand.execute();

            // Assert.
            strict.equal(saveRaised, undefined);
            strict.equal(viewModel.saveCommand.canExecute(), false);
        });

        it('canExecuteChanged raised: status.', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let raised = false;
            viewModel.saveCommand.canExecuteChanged.subscribe(() => raised = true);

            // Act.
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });

            // Assert.
            strict.equal(raised, true);
        });
    });

    describe('stop command', function () {
        it('can execute when server stoppable', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let stopRaised = undefined;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'stop') {
                    stopRaised = true;
                }
            });

            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Running, oldStatus: FactorioServerStatus.Unknown });

            // Act.
            viewModel.stopCommand.execute();

            // Assert.
            strict.equal(stopRaised, true);
            strict.equal(viewModel.stopCommand.canExecute(), true);
        });

        it('can not execute when server not stoppable', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let stopRaised = undefined;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'stop') {
                    stopRaised = true;
                }
            });

            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });

            // Act.
            viewModel.stopCommand.execute();

            // Assert.
            strict.equal(stopRaised, undefined);
            strict.equal(viewModel.stopCommand.canExecute(), false);
        });

        it('canExecuteChanged raised: status.', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let raised = false;
            viewModel.saveCommand.canExecuteChanged.subscribe(() => raised = true);

            // Act.
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });

            // Assert.
            strict.equal(raised, true);
        });
    });

    describe('force stop command', function () {
        it('can execute', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let forceStopRaised = undefined;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'forceStop') {
                    forceStopRaised = true;
                }
            });

            // Act.
            viewModel.forceStopCommand.execute();

            // Assert.
            strict.equal(forceStopRaised, true);
            strict.equal(viewModel.forceStopCommand.canExecute(), true);
        });
    });

    describe('send text command', function () {
        it('can execute', function () {
            // Arrange.          
            const message = 'message';

            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let messageSent = undefined;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'sendToFactorio') {
                    messageSent = event.args[0];
                }
            });

            viewModel.sendText = message;

            // Act.
            viewModel.sendCommand.execute();

            // Assert.
            strict.equal(messageSent, message);
            strict.equal(viewModel.sendCommand.canExecute(), true);
        })

        it('can execute enter key', function () {
            // Arrange.          
            const message = 'message';

            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let messageSent = undefined;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'sendToFactorio') {
                    messageSent = event.args[0];
                }
            });

            viewModel.sendText = message;

            // Act.
            viewModel.sendInputKey(13); // enter

            // Assert.
            strict.equal(messageSent, message);
            strict.equal(viewModel.sendCommand.canExecute(), true);
        })

        it('does not send empty string.', function () {
            // Arrange.          
            const message = '';

            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let messageSent = undefined;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'sendToFactorio') {
                    messageSent = event.args[0];
                }
            });

            viewModel.sendText = message;

            // Act.
            viewModel.sendCommand.execute();

            // Assert.
            strict.equal(messageSent, undefined);
        });

        it('does write to command history.', function () {
            // Arrange.     
            const message1 = 'message1';
            const message2 = 'message2';
            const message3 = 'message3';

            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            viewModel.sendText = message1;
            viewModel.sendCommand.execute();

            viewModel.sendText = message2;
            viewModel.sendCommand.execute();

            viewModel.sendText = message3;
            viewModel.sendCommand.execute();

            // Act + Assert prev.
            viewModel.sendInputKey(38); // up
            strict.equal(viewModel.sendText, message3);

            viewModel.sendInputKey(38); // up
            strict.equal(viewModel.sendText, message2);

            viewModel.sendInputKey(38); // up
            strict.equal(viewModel.sendText, message1);

            // Act + Assert reset history index.
            viewModel.sendInputKey(27) // escape
            strict.equal(viewModel.sendText, '');

            // Act + Assert next.
            viewModel.sendInputKey(40); // down
            strict.equal(viewModel.sendText, message1);

            viewModel.sendInputKey(40); // down
            strict.equal(viewModel.sendText, message2);

            viewModel.sendInputKey(40); // down
            strict.equal(viewModel.sendText, message3);
        });

        it('send empty string resets history index', function () {
            // Arrange.          
            const message1 = 'message1';
            const message2 = 'message2';
            const message3 = 'message3';

            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            viewModel.sendText = message1;
            viewModel.sendCommand.execute();

            viewModel.sendText = message2;
            viewModel.sendCommand.execute();

            viewModel.sendText = message3;
            viewModel.sendCommand.execute();

            viewModel.sendInputKey(38); // up

            viewModel.sendText = '';

            // Act.
            viewModel.sendCommand.execute();

            // Assert.
            viewModel.sendInputKey(38); // up
            strict.equal(viewModel.sendText, message3);
        });
    });

    describe('resumeTooltip', function () {
        it('disabled message shows when server is running.', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            // Act.
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Running, oldStatus: FactorioServerStatus.Unknown });

            // Assert.
            strict.equal(viewModel.resumeTooltip, ServersConsoleViewModel.resumeTooltipDisabledMessage);
        });

        it('disabled message shows when no temp saves', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            // Act.            
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });

            // Assert.
            strict.equal(viewModel.resumeTooltip, ServersConsoleViewModel.resumeTooltipDisabledMessage);
        });

        it('when can resume message shows save that will be loaded.', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            // Act.
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile, tempFile2] });
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });

            // Assert.
            strict.equal(viewModel.resumeTooltip, 'Start server with latest Temp save: file2.zip.');
        });

        it('is initially set.', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            // Assert.
            strict.notEqual(viewModel.resumeTooltip, undefined);
        })

        it('raised when server status changed.', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Running, oldStatus: FactorioServerStatus.Unknown });

            let raisedCount = 0;
            viewModel.propertyChanged('resumeTooltip', event => raisedCount++);

            // Act.
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });

            // Assert.
            strict.equal(raisedCount, 1);
        });

        it('raised when temp saves changed.', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });

            let raisedCount = 0;
            viewModel.propertyChanged('resumeTooltip', event => raisedCount++);

            // Act.
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            // Assert.
            strict.equal(raisedCount, 1);
        });
    });

    describe('loadTooltip', function () {
        it('disabled message shows when server is running.', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._localSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [localFile] });

            let localFiles = mainViewModel.localFileViewModel.files;
            localFiles.setSingleSelected(localFiles.getBoxByKey(localFile.Name));

            // Act.            
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Running, oldStatus: FactorioServerStatus.Unknown });

            // Assert.
            strict.equal(viewModel.loadTooltip, ServersConsoleViewModel.loadTooltipDisabledMessage);
        });

        it('disabled message shows when no file selected.', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._localSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [localFile] });

            // Act.            
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });

            // Assert.
            strict.equal(viewModel.loadTooltip, ServersConsoleViewModel.loadTooltipDisabledMessage);
        });

        it('disabled message shows when multiple files selected.', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._localSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [localFile, localFile2] });

            let localFiles = mainViewModel.localFileViewModel.files;
            localFiles.selectAll();

            // Act.            
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });

            // Assert.
            strict.equal(viewModel.loadTooltip, ServersConsoleViewModel.loadTooltipDisabledMessage);
        });

        it('when can load message shows save that will be loaded.', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._localSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [localFile] });

            let localFiles = mainViewModel.localFileViewModel.files;
            localFiles.setSingleSelected(localFiles.getBoxByKey(localFile.Name));

            // Act.            
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });

            // Assert.
            strict.equal(viewModel.loadTooltip, 'Start server with selected save: Local Saves/local_file.zip.');
        });

        it('is initially set.', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            // Assert.
            strict.notEqual(viewModel.loadTooltip, undefined);
        })

        it('raised when server status changed.', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._localSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [localFile] });
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Running, oldStatus: FactorioServerStatus.Unknown });

            let localFiles = mainViewModel.localFileViewModel.files;
            localFiles.setSingleSelected(localFiles.getBoxByKey(localFile.Name));

            let raisedCount = 0;
            viewModel.propertyChanged('loadTooltip', event => raisedCount++);

            // Act.
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });

            // Assert.
            strict.equal(raisedCount, 1);
        });

        it('raised when temp saves changed.', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._localSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [localFile] });
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });

            let raisedCount = 0;
            viewModel.propertyChanged('loadTooltip', event => raisedCount++);

            // Act.
            let localFiles = mainViewModel.localFileViewModel.files;
            localFiles.setSingleSelected(localFiles.getBoxByKey(localFile.Name));

            // Assert.
            strict.equal(raisedCount, 1);
        });
    });

    describe('startScenarioTooltip', function () {
        it('disabled message shows when server is running.', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._scenarios.raise({ Type: CollectionChangeType.Reset, NewItems: [scenario] });

            let scenarios = mainViewModel.scenariosViewModel.scenarios;
            scenarios.setFirstSingleSelected();

            // Act.            
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Running, oldStatus: FactorioServerStatus.Unknown });

            // Assert.
            strict.equal(viewModel.startScenarioTooltip, ServersConsoleViewModel.startScenarioTooltipDisabledMessage);
        });

        it('disabled message shows when no scenario selected.', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._scenarios.raise({ Type: CollectionChangeType.Reset, NewItems: [scenario] });

            // Act.            
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });

            // Assert.
            strict.equal(viewModel.startScenarioTooltip, ServersConsoleViewModel.startScenarioTooltipDisabledMessage);
        });

        it('when can start scenario message shows scenario that will be started.', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._scenarios.raise({ Type: CollectionChangeType.Reset, NewItems: [scenario] });
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });

            let scenarios = mainViewModel.scenariosViewModel.scenarios;

            // Act.            
            scenarios.setFirstSingleSelected();

            // Assert.
            strict.equal(viewModel.startScenarioTooltip, 'Start server with selected scenario: scenario.');
        });

        it('is initially set.', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            // Assert.
            strict.notEqual(viewModel.startScenarioTooltip, undefined);
        });

        it('raised when server status changed.', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._scenarios.raise({ Type: CollectionChangeType.Reset, NewItems: [scenario] });
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });

            let scenarios = mainViewModel.scenariosViewModel.scenarios;
            scenarios.setFirstSingleSelected();

            let raisedCount = 0;
            viewModel.propertyChanged('startScenarioTooltip', event => raisedCount++);

            // Act.            
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Running, oldStatus: FactorioServerStatus.Unknown });

            // Assert.
            strict.equal(raisedCount, 1);
        });

        it('raised when selected scenarios changed.', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._scenarios.raise({ Type: CollectionChangeType.Reset, NewItems: [scenario] });
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });

            let scenarios = mainViewModel.scenariosViewModel.scenarios;

            let raisedCount = 0;
            viewModel.propertyChanged('startScenarioTooltip', event => raisedCount++);

            // Act.            
            scenarios.setFirstSingleSelected();

            // Assert.
            strict.equal(raisedCount, 1);
        });
    });

    describe('saveTooltip', function () {
        it('disabled message shows when server is not running.', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            // Act.            
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });

            // Assert.
            strict.equal(viewModel.saveTooltip, ServersConsoleViewModel.saveTooltipDisabledMessage);
        });

        it('enabled message shows when server is running.', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            // Act.            
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Running, oldStatus: FactorioServerStatus.Unknown });

            // Assert.
            strict.equal(viewModel.saveTooltip, ServersConsoleViewModel.saveTooltipEnabledMessage);
        });

        it('is initially set.', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            // Assert.
            strict.notEqual(viewModel.saveTooltip, undefined);
        });

        it('raised when server status changed.', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });

            let raisedCount = 0;
            viewModel.propertyChanged('saveTooltip', event => raisedCount++);

            // Act.            
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Running, oldStatus: FactorioServerStatus.Unknown });

            // Assert.
            strict.equal(raisedCount, 1);
        });
    });

    describe('manageVersionTooltip', function () {
        it('is initially set.', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            // Assert.
            strict.equal(viewModel.manageVersionTooltip, ServersConsoleViewModel.manageVersionTooltipMessage);
        });
    });

    describe('stopTooltip', function () {
        it('disabled message shows when server is not running.', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            // Act.            
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });

            // Assert.
            strict.equal(viewModel.stopTooltip, ServersConsoleViewModel.stopTooltipDisabledMessage);
        });

        it('enabled message shows when server is running.', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            // Act.            
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Running, oldStatus: FactorioServerStatus.Unknown });

            // Assert.
            strict.equal(viewModel.stopTooltip, ServersConsoleViewModel.stopTooltipEnabledMessage);
        });

        it('is initially set.', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            // Assert.
            strict.notEqual(viewModel.stopTooltip, undefined);
        });

        it('raised when server status changed.', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });

            let raisedCount = 0;
            viewModel.propertyChanged('stopTooltip', event => raisedCount++);

            // Act.            
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Running, oldStatus: FactorioServerStatus.Unknown });

            // Assert.
            strict.equal(raisedCount, 1);
        });
    });

    describe('forceStopTooltip', function () {
        it('is initially set.', function () {
            // Arrange.
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            // Assert.
            strict.equal(viewModel.forceStopTooltip, ServersConsoleViewModel.forceStopTooltipMessage);
        });
    });

    describe('messages', function () {
        it('raised when message is received', function () {
            // Arrange.
            const messageData: MessageData = { ServerId: '1', MessageType: MessageType.Control, Message: 'message' };

            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let messages = viewModel.messages;
            let actualEvent: CollectionChangedData<MessageData> = undefined;
            messages.subscribe(event => actualEvent = event);

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            // Act.
            hubService._onMessage.raise(messageData);

            // Assert.
            strict.equal(actualEvent.Type, CollectionChangeType.Add);
            strict.equal(actualEvent.NewItems[0], messageData);
        });
    });

    describe('Server Console data', function () {
        const defaultFactorioServerSettings: FactorioServerSettings = {
            Name: 'Name',
            Description: 'Description',
            Tags: ['Tags'],
            MaxPlayers: 0,
            GamePassword: 'GamePassword',
            MaxUploadSlots: 0,
            AutoPause: true,
            UseDefaultAdmins: true,
            Admins: ['Admins'],
            AutosaveInterval: 0,
            AutosaveSlots: 0,
            NonBlockingSaving: true,
            PublicVisible: true
        };

        class HubServiceMock extends ServersHubServiceMockBase {
            _connected = true;
            _version: string = '0.0.0';
            _factorioControlClientData: FactorioControlClientData = { Status: FactorioServerStatus.Unknown, Messages: [] };
            _serverSettings: FactorioServerSettings = defaultFactorioServerSettings;

            whenConnection(callback: () => void): () => void {
                let sub = super.whenConnection(callback);

                if (this._connected) {
                    callback();
                }

                return sub;
            }

            getVersion(): Promise<string> {
                super.getVersion();
                return Promise.resolve(this._version);
            }

            setServerId(value: string): Promise<FactorioControlClientData> {
                super.setServerId(value);
                return Promise.resolve(this._factorioControlClientData);
            }

            requestServerSettings() {
                setInterval(() => this._onServerSettings.raise({ settings: this._serverSettings, saved: true }), 0);
                super.requestServerSettings();
            }
        }

        it('updates when hub connection starts.', async function () {
            // Arrange.
            let factorioControlClientData: FactorioControlClientData = {
                Status: FactorioServerStatus.Stopped,
                Messages: [{ MessageType: MessageType.Control, ServerId: '1', Message: 'message' }]
            };

            let hubService = new HubServiceMock();
            hubService._connected = false;
            hubService._factorioControlClientData = factorioControlClientData;

            let services = new ServersPageTestServiceLocator();
            services.register(ServersHubService, () => hubService);

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            await PromiseHelper.delay(0);

            let nameEvent: string = undefined;
            viewModel.propertyChanged('nameText', event => nameEvent = event);

            let statusEvent: string = undefined;
            viewModel.propertyChanged('statusText', event => statusEvent = event);

            let versionEvent: string = undefined;
            viewModel.propertyChanged('versionText', event => versionEvent = event);

            let messageEvent: CollectionChangedData<MessageData> = undefined;
            viewModel.messages.subscribe(event => messageEvent = event);

            // Act.
            hubService._onConnection.raise();
            await PromiseHelper.delay(0);

            // Assert.
            strict.equal(nameEvent, 'Name: Name');
            strict.equal(statusEvent, 'Status: Stopped');
            strict.equal(versionEvent, 'Version: 0.0.0');
            strict.equal(messageEvent.Type, CollectionChangeType.Reset);
            strict.deepEqual([...viewModel.messages.values()], factorioControlClientData.Messages);
        });

        it('updates when first loading', async function () {
            // Arrange.
            let factorioControlClientData: FactorioControlClientData = {
                Status: FactorioServerStatus.Stopped,
                Messages: [{ MessageType: MessageType.Control, ServerId: '1', Message: 'message' }]
            };

            let hubService = new HubServiceMock();
            hubService._version = '0.0.1';
            hubService._factorioControlClientData = factorioControlClientData;

            let services = new ServersPageTestServiceLocator();
            services.register(ServersHubService, () => hubService);

            // Act.
            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;
            await PromiseHelper.delay(0);

            // Assert.
            strict.equal(viewModel.nameText, 'Name: Name');
            strict.equal(viewModel.statusText, 'Status: Stopped');
            strict.equal(viewModel.versionText, 'Version: 0.0.1');
            strict.deepEqual([...viewModel.messages.values()], factorioControlClientData.Messages);
        });

        it('updates when changing server Id', async function () {
            // Arrange.
            let factorioControlClientData: FactorioControlClientData = {
                Status: FactorioServerStatus.Unknown,
                Messages: [{ MessageType: MessageType.Control, ServerId: '2', Message: 'message' }]
            };

            let version = '0.0.1';

            let hubService = new HubServiceMock();
            hubService._version = version;
            hubService._factorioControlClientData = factorioControlClientData;

            let services = new ServersPageTestServiceLocator();
            services.register(ServersHubService, () => hubService);

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            await PromiseHelper.delay(0);

            let nameEvent: string = undefined;
            viewModel.propertyChanged('nameText', event => nameEvent = event);

            let statusEvent: string = undefined;
            viewModel.propertyChanged('statusText', event => statusEvent = event);

            let versionEvent: string = undefined;
            viewModel.propertyChanged('versionText', event => versionEvent = event);

            let messageEvent: CollectionChangedData<MessageData> = undefined;
            viewModel.messages.subscribe(event => messageEvent = event);

            hubService._serverSettings.Name = 'Name2';
            factorioControlClientData.Status = FactorioServerStatus.Stopped;
            hubService._version = '0.0.2';

            let serverIds = viewModel.serverIds;

            // Act.            
            serverIds.setSingleSelected(serverIds.getBoxByKey('2'));
            await PromiseHelper.delay(0);

            // Assert.
            strict.equal(nameEvent, 'Name: Name2');
            strict.equal(statusEvent, 'Status: Stopped');
            strict.equal(versionEvent, 'Version: 0.0.2');
            strict.equal(messageEvent.Type, CollectionChangeType.Reset);
            strict.deepEqual([...viewModel.messages.values()], factorioControlClientData.Messages);
        });
    });
});