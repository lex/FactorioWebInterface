import { strict } from "assert";
import { ServersPageTestServiceLocator } from "../../testUtils/testServiceLocator";
import { ServersViewModel } from "./serversViewModel";
import { ServersHubServiceMockBase } from "../../testUtils/pages/servers/serversHubServiceMockBase";
import { ServersHubService } from "./serversHubService";
import { CollectionChangeType, Result } from "../../ts/utils";
import { FileMetaData } from "./serversTypes";
import { FileSelectionServiceMockBase } from "../../testUtils/services/fileSelectionServiceMockBase";
import { FileSelectionService } from "../../services/fileSelectionService";
import { UploadService, FileUploadEvent, FileUploadEventType } from "../../services/uploadService";
import { UploadServiceMockBase } from "../../testUtils/services/uploadServiceMockBase";
import { MethodInvocation } from "../../testUtils/invokeBase";
import { PromiseHelper } from "../../utils/promiseHelper";
import { ServerFileManagementService } from "./serverFileManagementService";
import { ServerFileManagementViewModel } from "./serverFileManagementViewModel";
import { ErrorServiceMockBase } from "../../testUtils/services/errorServiceMockBase";
import { ErrorService } from "../../services/errorService";

const tempFile: FileMetaData = {
    Name: 'file.zip',
    Size: 0,
    Directory: 'saves',
    CreatedTime: '2020-01-01 00:00:00',
    LastModifiedTime: '2020-01-01 00:00:00'
};

const tempFile2: FileMetaData = {
    Name: 'file2.zip',
    Size: 0,
    Directory: 'saves',
    CreatedTime: '2020-01-01 00:00:00',
    LastModifiedTime: '2020-01-01 00:00:00'
};

const localFile: FileMetaData = {
    Name: 'local_file.zip',
    Size: 0,
    Directory: 'local_saves',
    CreatedTime: '2020-01-01 00:00:00',
    LastModifiedTime: '2020-01-01 00:00:00'
};

const localFile2: FileMetaData = {
    Name: 'local_file2.zip',
    Size: 0,
    Directory: 'local_saves',
    CreatedTime: '2020-01-01 00:00:00',
    LastModifiedTime: '2020-01-01 00:00:00'
};

const globalFile: FileMetaData = {
    Name: 'global_file.zip',
    Size: 0,
    Directory: 'global_saves',
    CreatedTime: '2020-01-01 00:00:00',
    LastModifiedTime: '2020-01-01 00:00:00'
};

const globalFile2: FileMetaData = {
    Name: 'global_file2.zip',
    Size: 0,
    Directory: 'global_saves',
    CreatedTime: '2020-01-01 00:00:00',
    LastModifiedTime: '2020-01-01 00:00:00'
};

describe('ServerFileManagementViewModel', function () {
    describe('upload save command', function () {
        it('can execute when not uploading', async function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let file: File = {} as File;
            let fileSelectionService: FileSelectionServiceMockBase = services.get(FileSelectionService);
            fileSelectionService._filesToReturn = [file];

            let actualUploadEvent: MethodInvocation = undefined;
            let uploadService: UploadServiceMockBase = services.get(UploadService);
            uploadService.methodCalled.subscribe(event => {
                if (event.name === 'uploadFormData') {
                    actualUploadEvent = event;
                }
            });

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            strict.equal(viewModel.uploadSavesCommand.canExecute(), true);

            // Act.
            viewModel.uploadSavesCommand.execute();
            await PromiseHelper.delay(0);

            // Assert.
            let actaulUrl: string = actualUploadEvent.args[0]
            strict.equal(actaulUrl, ServerFileManagementService.fileUploadUrl);

            let actualFormData: FormData = actualUploadEvent.args[1];
            let files = actualFormData.getAll('files') as File[];
            strict.equal(files[0], file);

            strict.equal(viewModel.isUploading.value, true);
        });

        it('can not execute when uploading', async function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let file: File = {} as File;
            let fileSelectionService: FileSelectionServiceMockBase = services.get(FileSelectionService);
            fileSelectionService._filesToReturn = [file];

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            strict.equal(viewModel.uploadSavesCommand.canExecute(), true);

            // Execute command to start an upload.
            viewModel.uploadSavesCommand.execute();
            await PromiseHelper.delay(0);

            strict.equal(viewModel.isUploading.value, true);

            let actualUploadEvent: MethodInvocation = undefined;
            let uploadService: UploadServiceMockBase = services.get(UploadService);
            uploadService.methodCalled.subscribe(event => {
                if (event.name === 'uploadFormData') {
                    actualUploadEvent = event;
                }
            });

            // Act.
            viewModel.uploadSavesCommand.execute();
            await PromiseHelper.delay(0);

            // Assert.
            strict.equal(viewModel.uploadSavesCommand.canExecute(), false);
            strict.equal(actualUploadEvent, undefined);
        });

        it('canExecuteRaised when uploading changes', async function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let file: File = {} as File;
            let fileSelectionService: FileSelectionServiceMockBase = services.get(FileSelectionService);
            fileSelectionService._filesToReturn = [file];

            let uploadService: UploadServiceMockBase = services.get(UploadService);
            let callback: (event: FileUploadEvent) => void;
            uploadService.methodCalled.subscribe(event => {
                if (event.name === 'uploadFormData') {
                    callback = event.args[2];
                }
            });

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            strict.equal(viewModel.uploadSavesCommand.canExecute(), true);

            let calledCount = 0;
            viewModel.uploadSavesCommand.canExecuteChanged.subscribe(() => calledCount++);

            // Execute command to start an upload.
            viewModel.uploadSavesCommand.execute();
            await PromiseHelper.delay(0);

            // Assert.
            strict.equal(viewModel.uploadSavesCommand.canExecute(), false);
            strict.equal(viewModel.isUploading.value, true);
            strict.equal(calledCount, 1);

            // Finish upload.
            callback({ type: FileUploadEventType.end, result: { Success: true } });

            // Assert.
            strict.equal(viewModel.uploadSavesCommand.canExecute(), true);
            strict.equal(viewModel.isUploading.value, false);
            strict.equal(calledCount, 2);
        })
    });

    describe('delete saves command', function () {
        it('can execute when saves are selected', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let actualFiles: string[] = undefined;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'deleteFiles') {
                    actualFiles = event.args[0];
                }
            });

            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            let tempFiles = mainViewModel.tempFileViewModel.files;
            tempFiles.setSingleSelected(tempFile.Name);

            strict.equal(viewModel.deleteSavesCommand.canExecute(), true);

            // Act.
            viewModel.deleteSavesCommand.execute();

            // Assert.
            strict.equal(actualFiles[0], `${tempFile.Directory}/${tempFile.Name}`);
        });

        it('can not execute when no saves are selected', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let actualFiles: string[] = undefined;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'deleteFiles') {
                    actualFiles = event.args[0];
                }
            });

            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            // Act.
            viewModel.deleteSavesCommand.execute();

            // Assert.
            strict.equal(viewModel.deleteSavesCommand.canExecute(), false);
            strict.equal(actualFiles, undefined);
        });

        it('canExecuteChanged raised when saves are selected', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            let raised = false;
            viewModel.deleteSavesCommand.canExecuteChanged.subscribe(() => raised = true);

            let tempFiles = mainViewModel.tempFileViewModel.files;

            // Act.
            tempFiles.setSingleSelected(tempFile.Name);

            // Assert.
            strict.equal(raised, true);
        });

        let testCases = [
            {
                name: 'temp',
                expected: [`${tempFile.Directory}/${tempFile.Name}`],
                arrange: (vm: ServersViewModel) => {
                    let files = vm.tempFileViewModel.files;
                    files.setSingleSelected(tempFile.Name);
                }
            },
            {
                name: 'temp2',
                expected: [`${tempFile2.Directory}/${tempFile2.Name}`],
                arrange: (vm: ServersViewModel) => {
                    let files = vm.tempFileViewModel.files;
                    files.setSingleSelected(tempFile2.Name);
                }
            },
            {
                name: 'local',
                expected: [`${localFile.Directory}/${localFile.Name}`],
                arrange: (vm: ServersViewModel) => {
                    let files = vm.localFileViewModel.files;
                    files.setSingleSelected(localFile.Name);
                }
            },
            {
                name: 'global',
                expected: [`${globalFile.Directory}/${globalFile.Name}`],
                arrange: (vm: ServersViewModel) => {
                    let files = vm.globalFileViewModel.files;
                    files.setSingleSelected(globalFile.Name);
                }
            },
            {
                name: 'all',
                expected: [
                    `${tempFile.Directory}/${tempFile.Name}`,
                    `${tempFile2.Directory}/${tempFile2.Name}`,
                    `${localFile.Directory}/${localFile.Name}`,
                    `${localFile.Directory}/${localFile2.Name}`,
                    `${globalFile.Directory}/${globalFile.Name}`,
                    `${globalFile2.Directory}/${globalFile2.Name}`
                ],
                arrange: (vm: ServersViewModel) => {
                    vm.tempFileViewModel.files.selectAll();
                    vm.localFileViewModel.files.selectAll();
                    vm.globalFileViewModel.files.selectAll();
                }
            },
        ]

        for (let testCase of testCases) {
            it(`deletes the selected saves ${testCase.name}`, function () {
                // Arrange.          
                let services = new ServersPageTestServiceLocator();

                let mainViewModel: ServersViewModel = services.get(ServersViewModel);
                let viewModel = mainViewModel.serverFileManagementViewModel;

                let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

                let actualFiles: string[] = undefined;
                hubService.methodCalled.subscribe(event => {
                    if (event.name === 'deleteFiles') {
                        actualFiles = event.args[0];
                    }
                });

                hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile, tempFile2] });
                hubService._localSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [localFile, localFile2] });
                hubService._globalSaveFiles.raise({ Type: CollectionChangeType.Reset, NewItems: [globalFile, globalFile2] });

                testCase.arrange(mainViewModel);

                // Act.
                viewModel.deleteSavesCommand.execute();

                // Assert.
                strict.deepEqual(actualFiles.sort(), testCase.expected.sort());
            });
        }
    });

    describe('move save command', function () {
        it('can execute when saves are selected', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let destination = viewModel.destinationsCollectionView.getItemByKey('1/local_saves');
            viewModel.destinationsCollectionView.setSingleSelected(destination.path);

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            let tempFiles = mainViewModel.tempFileViewModel.files;
            tempFiles.setSingleSelected(tempFile.Name);

            // Act.
            strict.equal(viewModel.moveSavesCommand.canExecute(), true);
            viewModel.moveSavesCommand.execute();

            // Assert.
            let expectedFiles = [`${tempFile.Directory}/${tempFile.Name}`];
            hubService.assertMethodCalled('moveFiles', destination.path, expectedFiles);
        });

        it('can not execute when no saves are selected', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            // Act.
            strict.equal(viewModel.moveSavesCommand.canExecute(), false);
            viewModel.moveSavesCommand.execute();

            // Assert.            
            hubService.assertMethodNotCalled('moveFiles');
        });

        it('canExecuteChanged raised when saves are selected', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            let raised = false;
            viewModel.moveSavesCommand.canExecuteChanged.subscribe(() => raised = true);

            let tempFiles = mainViewModel.tempFileViewModel.files;

            // Act.
            tempFiles.setSingleSelected(tempFile.Name);

            // Assert.
            strict.equal(raised, true);
        });

        let testCases = [
            {
                name: 'temp',
                expected: [`${tempFile.Directory}/${tempFile.Name}`],
                path: 'public/start',
                arrange: (vm: ServersViewModel) => {
                    let files = vm.tempFileViewModel.files;
                    files.setSingleSelected(tempFile.Name);
                }
            },
            {
                name: 'temp2',
                expected: [`${tempFile2.Directory}/${tempFile2.Name}`],
                path: 'global_saves',
                arrange: (vm: ServersViewModel) => {
                    let files = vm.tempFileViewModel.files;
                    files.setSingleSelected(tempFile2.Name);
                }
            },
            {
                name: 'local',
                expected: [`${localFile.Directory}/${localFile.Name}`],
                path: '1/local_saves',
                arrange: (vm: ServersViewModel) => {
                    let files = vm.localFileViewModel.files;
                    files.setSingleSelected(localFile.Name);
                }
            },
            {
                name: 'global',
                expected: [`${globalFile.Directory}/${globalFile.Name}`],
                path: 'public/final',
                arrange: (vm: ServersViewModel) => {
                    let files = vm.globalFileViewModel.files;
                    files.setSingleSelected(globalFile.Name);
                }
            },
            {
                name: 'all',
                expected: [
                    `${tempFile.Directory}/${tempFile.Name}`,
                    `${tempFile2.Directory}/${tempFile2.Name}`,
                    `${localFile.Directory}/${localFile.Name}`,
                    `${localFile.Directory}/${localFile2.Name}`,
                    `${globalFile.Directory}/${globalFile.Name}`,
                    `${globalFile2.Directory}/${globalFile2.Name}`
                ],
                path: 'public/old',
                arrange: (vm: ServersViewModel) => {
                    vm.tempFileViewModel.files.selectAll();
                    vm.localFileViewModel.files.selectAll();
                    vm.globalFileViewModel.files.selectAll();
                }
            },
        ]

        for (let testCase of testCases) {
            it(`moves the selected saves ${testCase.name}`, function () {
                // Arrange.          
                let services = new ServersPageTestServiceLocator();

                let mainViewModel: ServersViewModel = services.get(ServersViewModel);
                let viewModel = mainViewModel.serverFileManagementViewModel;

                let destination = viewModel.destinationsCollectionView.getItemByKey(testCase.path);
                viewModel.destinationsCollectionView.setSingleSelected(destination.path);

                let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

                let actualPath: string = undefined
                let actualFiles: string[] = undefined;
                hubService.methodCalled.subscribe(event => {
                    if (event.name === 'moveFiles') {
                        actualPath = event.args[0];
                        actualFiles = event.args[1];
                    }
                });

                hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile, tempFile2] });
                hubService._localSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [localFile, localFile2] });
                hubService._globalSaveFiles.raise({ Type: CollectionChangeType.Reset, NewItems: [globalFile, globalFile2] });

                testCase.arrange(mainViewModel);

                // Act.
                viewModel.moveSavesCommand.execute();

                // Assert.
                strict.equal(actualPath, testCase.path);
                strict.deepEqual(actualFiles.sort(), testCase.expected.sort());
            });
        }
    });

    describe('copy save command', function () {
        it('can execute when saves are selected', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let destination = viewModel.destinationsCollectionView.getItemByKey('1/local_saves');
            viewModel.destinationsCollectionView.setSingleSelected(destination.path);

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            let tempFiles = mainViewModel.tempFileViewModel.files;
            tempFiles.setSingleSelected(tempFile.Name);

            // Act.
            strict.equal(viewModel.copySavesCommand.canExecute(), true);
            viewModel.copySavesCommand.execute();

            // Assert.            
            let expectedFiles = [`${tempFile.Directory}/${tempFile.Name}`];
            hubService.assertMethodCalled('copyFiles', destination.path, expectedFiles);
        });

        it('can not execute when no saves are selected', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            // Act.
            strict.equal(viewModel.copySavesCommand.canExecute(), false);
            viewModel.copySavesCommand.execute();

            // Assert.            
            hubService.assertMethodNotCalled('copyFiles');
        });

        it('canExecuteChanged raised when saves are selected', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            let raised = false;
            viewModel.copySavesCommand.canExecuteChanged.subscribe(() => raised = true);

            let tempFiles = mainViewModel.tempFileViewModel.files;

            // Act.
            tempFiles.setSingleSelected(tempFile.Name);

            // Assert.
            strict.equal(raised, true);
        });

        let testCases = [
            {
                name: 'temp',
                expected: [`${tempFile.Directory}/${tempFile.Name}`],
                path: 'public/start',
                arrange: (vm: ServersViewModel) => {
                    let files = vm.tempFileViewModel.files;
                    files.setSingleSelected(tempFile.Name);
                }
            },
            {
                name: 'temp2',
                expected: [`${tempFile2.Directory}/${tempFile2.Name}`],
                path: 'global_saves',
                arrange: (vm: ServersViewModel) => {
                    let files = vm.tempFileViewModel.files;
                    files.setSingleSelected(tempFile2.Name);
                }
            },
            {
                name: 'local',
                expected: [`${localFile.Directory}/${localFile.Name}`],
                path: '1/local_saves',
                arrange: (vm: ServersViewModel) => {
                    let files = vm.localFileViewModel.files;
                    files.setSingleSelected(localFile.Name);
                }
            },
            {
                name: 'global',
                expected: [`${globalFile.Directory}/${globalFile.Name}`],
                path: 'public/final',
                arrange: (vm: ServersViewModel) => {
                    let files = vm.globalFileViewModel.files;
                    files.setSingleSelected(globalFile.Name);
                }
            },
            {
                name: 'all',
                expected: [
                    `${tempFile.Directory}/${tempFile.Name}`,
                    `${tempFile2.Directory}/${tempFile2.Name}`,
                    `${localFile.Directory}/${localFile.Name}`,
                    `${localFile.Directory}/${localFile2.Name}`,
                    `${globalFile.Directory}/${globalFile.Name}`,
                    `${globalFile2.Directory}/${globalFile2.Name}`
                ],
                path: 'public/old',
                arrange: (vm: ServersViewModel) => {
                    vm.tempFileViewModel.files.selectAll();
                    vm.localFileViewModel.files.selectAll();
                    vm.globalFileViewModel.files.selectAll();
                }
            },
        ]

        for (let testCase of testCases) {
            it(`copies the selected saves ${testCase.name}`, function () {
                // Arrange.          
                let services = new ServersPageTestServiceLocator();

                let mainViewModel: ServersViewModel = services.get(ServersViewModel);
                let viewModel = mainViewModel.serverFileManagementViewModel;

                let destination = viewModel.destinationsCollectionView.getItemByKey(testCase.path);
                viewModel.destinationsCollectionView.setSingleSelected(destination.path);

                let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

                let actualPath: string = undefined
                let actualFiles: string[] = undefined;
                hubService.methodCalled.subscribe(event => {
                    if (event.name === 'copyFiles') {
                        actualPath = event.args[0];
                        actualFiles = event.args[1];
                    }
                });

                hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile, tempFile2] });
                hubService._localSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [localFile, localFile2] });
                hubService._globalSaveFiles.raise({ Type: CollectionChangeType.Reset, NewItems: [globalFile, globalFile2] });

                testCase.arrange(mainViewModel);

                // Act.
                viewModel.copySavesCommand.execute();

                // Assert.
                strict.equal(actualPath, testCase.path);
                strict.deepEqual(actualFiles.sort(), testCase.expected.sort());
            });
        }
    });

    describe('rename save command', function () {
        it('can rename save', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            let tempFiles = mainViewModel.tempFileViewModel.files;
            let selectedFile = tempFiles.getItemByKey(tempFile.Name);
            tempFiles.setSingleSelected(selectedFile.Name);

            viewModel.newFileName = 'newName';

            // Act.
            strict.equal(viewModel.renameSaveCommand.canExecute(), true);
            viewModel.renameSaveCommand.execute();

            // Assert.                                    
            hubService.assertMethodCalled('renameFile', selectedFile.Directory, selectedFile.Name, viewModel.newFileName);
        });

        it('can not rename when no save selected', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            viewModel.newFileName = 'newName';

            // Act.
            strict.equal(viewModel.renameSaveCommand.canExecute(), false);
            viewModel.renameSaveCommand.execute();

            // Assert.                                    
            hubService.assertMethodNotCalled('renameFile');
        });

        it('can not rename when multiple saves selected', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile, localFile] });

            mainViewModel.tempFileViewModel.files.selectAll();
            mainViewModel.localFileViewModel.files.selectAll();

            viewModel.newFileName = 'newName';

            // Act.
            strict.equal(viewModel.renameSaveCommand.canExecute(), false);
            viewModel.renameSaveCommand.execute();

            // Assert.                                    
            hubService.assertMethodNotCalled('renameFile');
        });

        it('can not rename when new name is blank', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            let tempFiles = mainViewModel.tempFileViewModel.files;
            let selectedFile = tempFiles.getItemByKey(tempFile.Name);
            tempFiles.setSingleSelected(selectedFile.Name);

            viewModel.newFileName = '';

            // Act.
            strict.equal(viewModel.renameSaveCommand.canExecute(), false);
            viewModel.renameSaveCommand.execute();

            // Assert.                                    
            hubService.assertMethodNotCalled('renameFile');
        });

        it('canExecuteChanged raised when saves are selected', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            let raised = false;
            viewModel.renameSaveCommand.canExecuteChanged.subscribe(() => raised = true);

            let tempFiles = mainViewModel.tempFileViewModel.files;

            // Act.
            tempFiles.setSingleSelected(tempFile.Name);

            // Assert.
            strict.equal(raised, true);
        });

        it('canExecuteChanged raised when new name changed', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            let raised = false;
            viewModel.renameSaveCommand.canExecuteChanged.subscribe(() => raised = true);

            // Act.
            viewModel.newFileName = 'newName';

            // Assert.
            strict.equal(raised, true);
        });
    });

    describe('deflate save command', function () {
        it('can deflate when single save selected', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            let tempFiles = mainViewModel.tempFileViewModel.files;
            let selectedFile = tempFiles.getItemByKey(tempFile.Name);
            tempFiles.setSingleSelected(selectedFile.Name);

            // Act.
            strict.equal(viewModel.deflateSaveCommand.canExecute(), true);
            viewModel.deflateSaveCommand.execute();

            // Assert.                     
            hubService.assertMethodCalled('deflateSave', selectedFile.Directory, selectedFile.Name, viewModel.newFileName);
        });

        it('can deflate when single save selected and new name', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            let tempFiles = mainViewModel.tempFileViewModel.files;
            let selectedFile = tempFiles.getItemByKey(tempFile.Name);
            tempFiles.setSingleSelected(selectedFile.Name);

            viewModel.newFileName = 'newName';

            // Act.
            strict.equal(viewModel.deflateSaveCommand.canExecute(), true);
            viewModel.deflateSaveCommand.execute();

            // Assert.                     
            hubService.assertMethodCalled('deflateSave', selectedFile.Directory, selectedFile.Name, viewModel.newFileName);
        });

        it('can not execute when deflating', async function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            let tempFiles = mainViewModel.tempFileViewModel.files;
            let selectedFile = tempFiles.getItemByKey(tempFile.Name);
            tempFiles.setSingleSelected(selectedFile.Name);

            // Execute command to start deflating.
            viewModel.deflateSaveCommand.execute();
            await PromiseHelper.delay(0);

            strict.equal(viewModel.isDeflating.value, true);

            let called = false;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'deflateSave') {
                    called = true;
                }
            })

            // Act.
            strict.equal(viewModel.deflateSaveCommand.canExecute(), false);
            viewModel.deflateSaveCommand.execute();

            // Assert.                     
            strict.equal(called, false);
        });

        it('can not deflate when no save selected', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            viewModel.newFileName = 'newName';

            // Act.
            strict.equal(viewModel.deflateSaveCommand.canExecute(), false);
            viewModel.deflateSaveCommand.execute();

            // Assert.                                    
            hubService.assertMethodNotCalled('deflateSave');
        });

        it('can not deflate when multiple saves selected', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile, localFile] });

            mainViewModel.tempFileViewModel.files.selectAll();
            mainViewModel.localFileViewModel.files.selectAll();

            viewModel.newFileName = 'newName';

            // Act.
            strict.equal(viewModel.deflateSaveCommand.canExecute(), false);
            viewModel.deflateSaveCommand.execute();

            // Assert.                                    
            hubService.assertMethodNotCalled('deflateSave');
        });

        it('canExecuteChanged raised when saves are selected', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            let raised = false;
            viewModel.deflateSaveCommand.canExecuteChanged.subscribe(() => raised = true);

            let tempFiles = mainViewModel.tempFileViewModel.files;

            // Act.
            tempFiles.setSingleSelected(tempFile.Name);

            // Assert.
            strict.equal(raised, true);
        });

        it('canExecuteChanged raised deflating changes', async function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            let tempFiles = mainViewModel.tempFileViewModel.files;
            tempFiles.setSingleSelected(tempFile.Name);

            let calledCount = 0;
            viewModel.deflateSaveCommand.canExecuteChanged.subscribe(() => calledCount++);

            // Start deflating.
            strict.equal(viewModel.deflateSaveCommand.canExecute(), true);
            viewModel.deflateSaveCommand.execute();
            await PromiseHelper.delay(0);

            // Assert.         
            strict.equal(viewModel.deflateSaveCommand.canExecute(), false);
            strict.equal(viewModel.isDeflating.value, true);
            strict.equal(calledCount, 1);

            // Stop deflating.
            hubService._onDeflateFinished.raise({ Success: true });

            // Assert.
            strict.equal(viewModel.deflateSaveCommand.canExecute(), true);
            strict.equal(viewModel.isDeflating.value, false);
            strict.equal(calledCount, 2);
        });
    });

    it('deflate reports error when error deflating', function () {
        // Arrange.          
        let services = new ServersPageTestServiceLocator();

        let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
        let errorService: ErrorServiceMockBase = services.get(ErrorService);

        // Needed to create all the services for the test.
        services.get(ServersViewModel);

        // Act.
        let error: Result = { Success: false };
        hubService._onDeflateFinished.raise(error);

        // Assert.
        strict.equal(errorService._errorsReported.length, 1);
    });

    describe('upload tooltip', function () {
        it('is initially set', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();
            let mainViewModel: ServersViewModel = services.get(ServersViewModel);

            // Act.
            let viewModel = mainViewModel.serverFileManagementViewModel;

            // Assert.
            strict.equal(viewModel.uploadSavesTooltip, ServerFileManagementViewModel.uploadSavesTooltipEnabledMessage);
        });

        it('enable message shows when not uploading', async function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();
            let mainViewModel: ServersViewModel = services.get(ServersViewModel);

            // Act.
            let viewModel = mainViewModel.serverFileManagementViewModel;
            strict.equal(viewModel.isUploading.value, false);

            // Assert.
            strict.equal(viewModel.uploadSavesTooltip, ServerFileManagementViewModel.uploadSavesTooltipEnabledMessage);
        });

        it('disabled message shows when uploading', async function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let file: File = {} as File;
            let fileSelectionService: FileSelectionServiceMockBase = services.get(FileSelectionService);
            fileSelectionService._filesToReturn = [file];

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            // Act.
            viewModel.uploadSavesCommand.execute();
            await PromiseHelper.delay(0);

            // Assert.
            strict.equal(viewModel.isUploading.value, true);
            strict.equal(viewModel.uploadSavesTooltip, ServerFileManagementViewModel.uploadSavesTooltipDisabledMessage);
        });

        it('raised when upload state changes', async function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let file: File = {} as File;
            let fileSelectionService: FileSelectionServiceMockBase = services.get(FileSelectionService);
            fileSelectionService._filesToReturn = [file];

            let uploadService: UploadServiceMockBase = services.get(UploadService);
            let callback: (event: FileUploadEvent) => void;
            uploadService.methodCalled.subscribe(event => {
                if (event.name === 'uploadFormData') {
                    callback = event.args[2];
                }
            });

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            strict.equal(viewModel.uploadSavesCommand.canExecute(), true);

            let calledCount = 0;
            viewModel.propertyChanged('uploadSavesTooltip', () => calledCount++);

            // Execute command to start an upload.
            viewModel.uploadSavesCommand.execute();
            await PromiseHelper.delay(0);

            // Assert.            
            strict.equal(viewModel.isUploading.value, true);
            strict.equal(viewModel.uploadSavesTooltip, ServerFileManagementViewModel.uploadSavesTooltipDisabledMessage);
            strict.equal(calledCount, 1);

            // Finish upload.
            callback({ type: FileUploadEventType.end, result: { Success: true } });

            // Assert.            
            strict.equal(viewModel.isUploading.value, false);
            strict.equal(viewModel.uploadSavesTooltip, ServerFileManagementViewModel.uploadSavesTooltipEnabledMessage);
            strict.equal(calledCount, 2);
        });
    });

    describe('delete tooltip', function () {
        it('is initially set', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();
            let mainViewModel: ServersViewModel = services.get(ServersViewModel);

            // Act.
            let viewModel = mainViewModel.serverFileManagementViewModel;

            // Assert.
            strict.equal(viewModel.deleteSavesTooltip, ServerFileManagementViewModel.deleteSavesTooltipDisabledMessage);
        });

        it('shows disabled message when no saves are selected', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            // Assert.
            strict.equal(viewModel.deleteSavesTooltip, ServerFileManagementViewModel.deleteSavesTooltipDisabledMessage);
        });

        it('shows single save that will be deleted', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            let tempFiles = mainViewModel.tempFileViewModel.files;

            // Act.
            tempFiles.setSingleSelected(tempFile.Name);

            // Assert.
            strict.equal(viewModel.deleteSavesTooltip, 'Delete the save Temp Saves/file.zip.');
        });

        it('shows multiple saves that will be deleted', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile, tempFile2] });

            let tempFiles = mainViewModel.tempFileViewModel.files;

            // Act.
            tempFiles.selectAll();

            // Assert.
            strict.equal(viewModel.deleteSavesTooltip, 'Delete 2 selected saves.');
        });

        it('raises when selected changes', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            let tempFiles = mainViewModel.tempFileViewModel.files;

            let calledCount = 0;
            viewModel.propertyChanged('deleteSavesTooltip', () => calledCount++);

            // Act select.
            tempFiles.setSingleSelected(tempFile.Name);

            // Assert.
            strict.equal(viewModel.deleteSavesTooltip, 'Delete the save Temp Saves/file.zip.');
            strict.equal(calledCount, 1);

            // Act unselect.
            tempFiles.unSelectAll();

            // Assert.
            strict.equal(viewModel.deleteSavesTooltip, ServerFileManagementViewModel.deleteSavesTooltipDisabledMessage);
            strict.equal(calledCount, 2);
        });
    });

    describe('move saves tooltip', function () {
        it('is initially set', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();
            let mainViewModel: ServersViewModel = services.get(ServersViewModel);

            // Act.
            let viewModel = mainViewModel.serverFileManagementViewModel;

            // Assert.
            strict.equal(viewModel.moveSavesTooltip, ServerFileManagementViewModel.moveSavesTooltipDisabledMessage);
        });

        it('shows disabled message when no saves are selected', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            // Assert.
            strict.equal(viewModel.moveSavesTooltip, ServerFileManagementViewModel.moveSavesTooltipDisabledMessage);
        });

        it('shows single save that will be moved', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let destination = viewModel.destinationsCollectionView.getItemByKey('1/local_saves');
            viewModel.destinationsCollectionView.setSingleSelected(destination.path);

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            let tempFiles = mainViewModel.tempFileViewModel.files;

            // Act.
            tempFiles.setSingleSelected(tempFile.Name);

            // Assert.
            strict.equal(viewModel.moveSavesTooltip, 'Move the save Temp Saves/file.zip to Local 1.');
        });

        it('shows multiple saves that will be moved', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let destination = viewModel.destinationsCollectionView.getItemByKey('1/local_saves');
            viewModel.destinationsCollectionView.setSingleSelected(destination.path);

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile, tempFile2] });

            let tempFiles = mainViewModel.tempFileViewModel.files;

            // Act.
            tempFiles.selectAll();

            // Assert.
            strict.equal(viewModel.moveSavesTooltip, 'Move 2 selected saves to Local 1.');
        });

        it('raises when selected changes', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let destination = viewModel.destinationsCollectionView.getItemByKey('1/local_saves');
            viewModel.destinationsCollectionView.setSingleSelected(destination.path);

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            let tempFiles = mainViewModel.tempFileViewModel.files;

            let calledCount = 0;
            viewModel.propertyChanged('moveSavesTooltip', () => calledCount++);

            // Act select.
            tempFiles.setSingleSelected(tempFile.Name);

            // Assert.
            strict.equal(viewModel.moveSavesTooltip, 'Move the save Temp Saves/file.zip to Local 1.');
            strict.equal(calledCount, 1);

            // Act unselect.
            tempFiles.unSelectAll();

            // Assert.
            strict.equal(viewModel.moveSavesTooltip, ServerFileManagementViewModel.moveSavesTooltipDisabledMessage);
            strict.equal(calledCount, 2);
        });
    });

    describe('copy saves tooltip', function () {
        it('is initially set', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();
            let mainViewModel: ServersViewModel = services.get(ServersViewModel);

            // Act.
            let viewModel = mainViewModel.serverFileManagementViewModel;

            // Assert.
            strict.equal(viewModel.copySavesTooltip, ServerFileManagementViewModel.copySavesTooltipDisabledMessage);
        });

        it('shows disabled message when no saves are selected', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            // Assert.
            strict.equal(viewModel.copySavesTooltip, ServerFileManagementViewModel.copySavesTooltipDisabledMessage);
        });

        it('shows single save that will be copied', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let destination = viewModel.destinationsCollectionView.getItemByKey('1/local_saves');
            viewModel.destinationsCollectionView.setSingleSelected(destination.path);

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            let tempFiles = mainViewModel.tempFileViewModel.files;

            // Act.
            tempFiles.setSingleSelected(tempFile.Name);

            // Assert.
            strict.equal(viewModel.copySavesTooltip, 'Copy the save Temp Saves/file.zip to Local 1.');
        });

        it('shows multiple saves that will be copied', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let destination = viewModel.destinationsCollectionView.getItemByKey('1/local_saves');
            viewModel.destinationsCollectionView.setSingleSelected(destination.path);

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile, tempFile2] });

            let tempFiles = mainViewModel.tempFileViewModel.files;

            // Act.
            tempFiles.selectAll();

            // Assert.
            strict.equal(viewModel.copySavesTooltip, 'Copy 2 selected saves to Local 1.');
        });

        it('raises when selected changes', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let destination = viewModel.destinationsCollectionView.getItemByKey('1/local_saves');
            viewModel.destinationsCollectionView.setSingleSelected(destination.path);

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            let tempFiles = mainViewModel.tempFileViewModel.files;

            let calledCount = 0;
            viewModel.propertyChanged('copySavesTooltip', () => calledCount++);

            // Act select.
            tempFiles.setSingleSelected(tempFile.Name);

            // Assert.
            strict.equal(viewModel.copySavesTooltip, 'Copy the save Temp Saves/file.zip to Local 1.');
            strict.equal(calledCount, 1);

            // Act unselect.
            tempFiles.unSelectAll();

            // Assert.
            strict.equal(viewModel.copySavesTooltip, ServerFileManagementViewModel.copySavesTooltipDisabledMessage);
            strict.equal(calledCount, 2);
        });
    });

    describe('rename tooltip', function () {
        it('is initially set', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();
            let mainViewModel: ServersViewModel = services.get(ServersViewModel);

            // Act.
            let viewModel = mainViewModel.serverFileManagementViewModel;

            // Assert.
            strict.equal(viewModel.renameSavesTooltip, ServerFileManagementViewModel.renameSaveTooltipDisableMessage);
        });

        it('shows disabled message when no saves are selected', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;
            viewModel.newFileName = 'newName';

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            // Assert.
            strict.equal(viewModel.renameSavesTooltip, ServerFileManagementViewModel.renameSaveTooltipDisableMessage);
        });

        it('shows disabled message when multiple saves are selected', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;
            viewModel.newFileName = 'newName';

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile, tempFile2] });

            // Act.
            mainViewModel.tempFileViewModel.files.selectAll();

            // Assert.
            strict.equal(viewModel.renameSavesTooltip, ServerFileManagementViewModel.renameSaveTooltipDisableMessage);
        });

        it('shows disabled message when no new name', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;
            viewModel.newFileName = '';

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            let tempFiles = mainViewModel.tempFileViewModel.files;

            // Act.
            tempFiles.setSingleSelected(tempFile.Name);

            // Assert.
            strict.equal(viewModel.renameSavesTooltip, ServerFileManagementViewModel.renameSaveTooltipDisableMessage);
        });

        it('shows single save that will be renamed', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;
            viewModel.newFileName = 'newName';

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            let tempFiles = mainViewModel.tempFileViewModel.files;

            // Act.
            tempFiles.setSingleSelected(tempFile.Name);

            // Assert.
            strict.equal(viewModel.renameSavesTooltip, 'Rename Temp Saves/file.zip to newName.zip.');
        });

        it('raises when selected changes', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;
            viewModel.newFileName = 'newName';

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            let tempFiles = mainViewModel.tempFileViewModel.files;

            let calledCount = 0;
            viewModel.propertyChanged('renameSavesTooltip', () => calledCount++);

            // Act select.
            tempFiles.setSingleSelected(tempFile.Name);

            // Assert.
            strict.equal(viewModel.renameSavesTooltip, 'Rename Temp Saves/file.zip to newName.zip.');
            strict.equal(calledCount, 1);

            // Act unselect.
            tempFiles.unSelectAll();

            // Assert.
            strict.equal(viewModel.renameSavesTooltip, ServerFileManagementViewModel.renameSaveTooltipDisableMessage);
            strict.equal(calledCount, 2);
        });

        it('raises when new name changes', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;
            viewModel.newFileName = '';

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            let tempFiles = mainViewModel.tempFileViewModel.files;
            tempFiles.setSingleSelected(tempFile.Name);

            let calledCount = 0;
            viewModel.propertyChanged('renameSavesTooltip', () => calledCount++);

            // Act set new name.
            viewModel.newFileName = 'newName';

            // Assert.
            strict.equal(viewModel.renameSavesTooltip, 'Rename Temp Saves/file.zip to newName.zip.');
            strict.equal(calledCount, 1);

            // Act unset new name.
            viewModel.newFileName = '';

            // Assert.
            strict.equal(viewModel.renameSavesTooltip, ServerFileManagementViewModel.renameSaveTooltipDisableMessage);
            strict.equal(calledCount, 2);
        });
    });

    describe('deflate tooltip', function () {
        it('is initially set', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();
            let mainViewModel: ServersViewModel = services.get(ServersViewModel);

            // Act.
            let viewModel = mainViewModel.serverFileManagementViewModel;

            // Assert.
            strict.equal(viewModel.deflateSavesTooltip, ServerFileManagementViewModel.deflateSaveTooltipDisableMessage);
        });

        it('disable message shows when no file selected', async function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            // Assert.            
            strict.equal(viewModel.deflateSavesTooltip, ServerFileManagementViewModel.deflateSaveTooltipDisableMessage);
        });

        it('disable message shows when multiple files selected', async function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile, tempFile2] });

            // Act.
            mainViewModel.tempFileViewModel.files.selectAll();

            // Assert.            
            strict.equal(viewModel.deflateSavesTooltip, ServerFileManagementViewModel.deflateSaveTooltipDisableMessage);
        });

        it('in progress message shows when deflating', async function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            let tempFiles = mainViewModel.tempFileViewModel.files;
            tempFiles.setSingleSelected(tempFile.Name);

            // Act.
            viewModel.deflateSaveCommand.execute();
            await PromiseHelper.delay(0);

            // Assert.
            strict.equal(viewModel.isDeflating.value, true);
            strict.equal(viewModel.deflateSavesTooltip, ServerFileManagementViewModel.deflateSaveTooltipInProgressDisableMessage);
        });

        it('shows single save that will be deflated with default name', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            let tempFiles = mainViewModel.tempFileViewModel.files;

            // Act.
            tempFiles.setSingleSelected(tempFile.Name);

            // Assert.
            strict.equal(viewModel.deflateSavesTooltip, 'Deflate Temp Saves/file.zip to file-deflated.zip.');
        });

        it('shows single save that will be deflated with new name', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;
            viewModel.newFileName = 'newName';

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            let tempFiles = mainViewModel.tempFileViewModel.files;

            // Act.
            tempFiles.setSingleSelected(tempFile.Name);

            // Assert.
            strict.equal(viewModel.deflateSavesTooltip, 'Deflate Temp Saves/file.zip to newName.zip.');
        });

        it('raises when selected changes', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            let tempFiles = mainViewModel.tempFileViewModel.files;

            let calledCount = 0;
            viewModel.propertyChanged('deflateSavesTooltip', () => calledCount++);

            // Act select.
            tempFiles.setSingleSelected(tempFile.Name);

            // Assert.
            strict.equal(viewModel.deflateSavesTooltip, 'Deflate Temp Saves/file.zip to file-deflated.zip.');
            strict.equal(calledCount, 1);

            // Act unselect.
            tempFiles.unSelectAll();

            // Assert.
            strict.equal(viewModel.deflateSavesTooltip, ServerFileManagementViewModel.deflateSaveTooltipDisableMessage);
            strict.equal(calledCount, 2);
        });

        it('raises when new name changes', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverFileManagementViewModel;
            viewModel.newFileName = '';

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            let tempFiles = mainViewModel.tempFileViewModel.files;
            tempFiles.setSingleSelected(tempFile.Name);

            let calledCount = 0;
            viewModel.propertyChanged('deflateSavesTooltip', () => calledCount++);

            // Act set new name.
            viewModel.newFileName = 'newName';

            // Assert.
            strict.equal(viewModel.deflateSavesTooltip, 'Deflate Temp Saves/file.zip to newName.zip.');
            strict.equal(calledCount, 1);

            // Act unset new name.
            viewModel.newFileName = '';

            // Assert.
            strict.equal(viewModel.deflateSavesTooltip, 'Deflate Temp Saves/file.zip to file-deflated.zip.');
            strict.equal(calledCount, 2);
        });
    });
});
