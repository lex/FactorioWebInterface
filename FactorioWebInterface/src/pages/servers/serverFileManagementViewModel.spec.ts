import { strict } from "assert";
import { ServersPageTestServiceLocator } from "../../testUtils/testServiceLocator";
import { ServersViewModel } from "./serversViewModel";
import { ServerFileManagementViewModel } from "./serverFileManagementViewModel";
import { ServersHubServiceMockBase } from "../../testUtils/pages/servers/serversHubServiceMockBase";
import { ServersHubService } from "./serversHubService";
import { CollectionChangeType } from "../../ts/utils";
import { FileMetaData } from "./serversTypes";
import { FileSelectionServiceMockBase } from "../../testUtils/services/fileSelectionServiceMockBase";
import { FileSelectionService } from "../../services/fileSelectionservice";
import { fileURLToPath } from "url";
import { UploadService } from "../../services/uploadService";
import { UploadServiceMockBase } from "../../testUtils/services/uploadServiceMockBase";
import { MethodInvocation } from "../../testUtils/invokeBase";
import { PromiseHelper } from "../../utils/promiseHelper";
import { ServerFileManagementService } from "./serverFileManagementService";
import { WindowServiceMockBase } from "../../testUtils/services/windowServiceMockBase";

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
    LastModifiedTime: '2020-01-01 00:00:00'
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
    });

    describe('delete saves command', function () {
        it('can execute when saves are selected.', function () {
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
            tempFiles.setSingleSelected(tempFiles.getBoxByKey(tempFile.Name));

            strict.equal(viewModel.deleteSavesCommand.canExecute(), true);

            // Act.
            viewModel.deleteSavesCommand.execute();

            // Assert.
            strict.equal(actualFiles[0], `${tempFile.Directory}/${tempFile.Name}`);
        });

        it('can not execute when no saves are selected.', function () {
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

        it('canExecuteChanged raised when saves are selected.', function () {
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
            tempFiles.setSingleSelected(tempFiles.getBoxByKey(tempFile.Name));

            // Assert.
            strict.equal(raised, true);
        });

        let testCases = [
            {
                name: 'temp',
                expected: [`${tempFile.Directory}/${tempFile.Name}`],
                arrange: (vm: ServersViewModel) => {
                    let files = vm.tempFileViewModel.files;
                    files.setSingleSelected(files.getBoxByKey(tempFile.Name));
                }
            },
            {
                name: 'temp2',
                expected: [`${tempFile2.Directory}/${tempFile2.Name}`],
                arrange: (vm: ServersViewModel) => {
                    let files = vm.tempFileViewModel.files;
                    files.setSingleSelected(files.getBoxByKey(tempFile2.Name));
                }
            },
            {
                name: 'local',
                expected: [`${localFile.Directory}/${localFile.Name}`],
                arrange: (vm: ServersViewModel) => {
                    let files = vm.localFileViewModel.files;
                    files.setSingleSelected(files.getBoxByKey(localFile.Name));
                }
            },
            {
                name: 'global',
                expected: [`${globalFile.Directory}/${globalFile.Name}`],
                arrange: (vm: ServersViewModel) => {
                    let files = vm.globalFileViewModel.files;
                    files.setSingleSelected(files.getBoxByKey(globalFile.Name));
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
            it(`deletes the selected saves ${testCase.name}.`, function () {
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
});