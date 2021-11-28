import { ModsPageTestServiceLocator } from "../../testUtils/testServiceLocator";
import { ModsViewModel } from "./modsViewModel";
import { ModsHubService } from "./modsHubService";
import { ModsHubServiceMockBase } from "../../testUtils/pages/mods/modsHubServiceMockBase";
import { ModPackMetaData, ModPackFileMetaData } from "../servers/serversTypes";
import { CollectionChangeType, Result } from "../../ts/utils";
import { strict } from "assert";
import { ModPackFilesViewModel } from "./modPackFilesViewModel";
import { FileSelectionService } from "../../services/fileSelectionService";
import { FileSelectionServiceMockBase } from "../../testUtils/services/fileSelectionServiceMockBase";
import { UploadService, FileUploadEvent, FileUploadEventType } from "../../services/uploadService";
import { UploadServiceMockBase } from "../../testUtils/services/uploadServiceMockBase";
import { ModsService } from "./modsService";
import { FormDataMock } from "../../testUtils/models/formDataMock";
import { ErrorService } from "../../services/errorService";
import { ErrorServiceMockBase } from "../../testUtils/services/errorServiceMockBase";
import { PromiseHelper } from "../../utils/promiseHelper";

const modPack: ModPackMetaData = {
    Name: 'name',
    CreatedTime: '2020-01-01 00:00:00',
    LastModifiedTime: '2020-01-01 00:00:00'
};

const modPack2: ModPackMetaData = {
    Name: 'name2',
    CreatedTime: '2020-01-02 00:00:00',
    LastModifiedTime: '2020-01-02 00:00:00'
};

const modPack3: ModPackMetaData = {
    Name: 'name3',
    CreatedTime: '2020-01-03 00:00:00',
    LastModifiedTime: '2020-01-03 00:00:00'
};

const modPacks = [modPack, modPack2, modPack3];

const modFile: ModPackFileMetaData = {
    Name: 'file abc',
    CreatedTime: '2020-01-01 00:00:00',
    LastModifiedTime: '2020-01-01 00:00:00',
    Size: 100
};

const modFile2: ModPackFileMetaData = {
    Name: 'file def',
    CreatedTime: '2020-01-02 00:00:00',
    LastModifiedTime: '2020-01-02 00:00:00',
    Size: 100
};

const modFile3: ModPackFileMetaData = {
    Name: 'file ghi',
    CreatedTime: '2020-01-03 00:00:00',
    LastModifiedTime: '2020-01-03 00:00:00',
    Size: 100
};

const modFiles = [modFile, modFile2, modFile3];

describe('ModPackFilesViewModel', function () {
    it('updates when first loading', function () {
        // Arrange.
        let services = new ModsPageTestServiceLocator();

        let hub: ModsHubServiceMockBase = services.get(ModsHubService);
        hub.methodCalled.subscribe(event => {
            if (event.name === 'whenConnection') {
                const callback: () => void = event.args[0];
                callback();
            }
        });

        // Act.        
        let mainViewModel: ModsViewModel = services.get(ModsViewModel);
        let viewModel = mainViewModel.modPackFilesViewModel;

        // Assert.
        hub.assertMethodCalled('requestModPacks');
        strict.equal(viewModel.isModPackSelected, false);
        strict.equal(viewModel.selectedModPack, undefined);
        strict.equal(viewModel.title, ModPackFilesViewModel.defaultTitle);
    });

    it('updates when hub connection starts', function () {
        // Arrange.
        let services = new ModsPageTestServiceLocator();

        let mainViewModel: ModsViewModel = services.get(ModsViewModel);

        let modPackViewModel = mainViewModel.modPacksViewModel;
        modPackViewModel.setSelectModPack(modPack);

        let viewModel = mainViewModel.modPackFilesViewModel;

        let hub: ModsHubServiceMockBase = services.get(ModsHubService);

        // Act.        
        hub._onConnection.raise();

        // Assert.
        hub.assertMethodCalled('requestModPacks');
        hub.assertMethodCalled('requestModPackFiles', modPack.Name);
    });

    it('does not requestModPackFiles when no selected mod pack when connection starts', function () {
        // Arrange.
        let services = new ModsPageTestServiceLocator();

        let mainViewModel: ModsViewModel = services.get(ModsViewModel);
        let viewModel = mainViewModel.modPackFilesViewModel;

        let hub: ModsHubServiceMockBase = services.get(ModsHubService);

        // Act.        
        hub._onConnection.raise();

        // Assert.
        hub.assertMethodCalled('requestModPacks');
        hub.assertMethodNotCalled('requestModPackFiles');
    });

    it('updates onSendModPacks', function () {
        // Arrange.
        let services = new ModsPageTestServiceLocator();

        let mainViewModel: ModsViewModel = services.get(ModsViewModel);
        let viewModel = mainViewModel.modPackFilesViewModel;

        let hub: ModsHubServiceMockBase = services.get(ModsHubService);

        // Act.        
        hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: modPacks });

        // Assert.        
        // mod packs should be sorted by LastModifiedTime descending.     
        let expected = [modPack3, modPack2, modPack];
        strict.deepEqual([...viewModel.modPacks], expected);
    });

    it('updates onSendModPackFiles', function () {
        // Arrange.
        let services = new ModsPageTestServiceLocator();

        let mainViewModel: ModsViewModel = services.get(ModsViewModel);

        let modPackViewModel = mainViewModel.modPacksViewModel;
        modPackViewModel.setSelectModPack(modPack);

        let viewModel = mainViewModel.modPackFilesViewModel;

        let hub: ModsHubServiceMockBase = services.get(ModsHubService);

        // Act.        
        hub._onSendModPackFiles.raise({ modPack: modPack.Name, data: { Type: CollectionChangeType.Reset, NewItems: [modFile2, modFile] } });

        // Assert.        
        // mod pack files should be sorted by name ascending. 
        let expected = [modFile, modFile2];
        strict.deepEqual([...viewModel.files], expected);
    });

    it('does not update onSendModPackFiles for not selected mod pack', function () {
        // Arrange.
        let services = new ModsPageTestServiceLocator();

        let mainViewModel: ModsViewModel = services.get(ModsViewModel);
        let viewModel = mainViewModel.modPackFilesViewModel;

        let hub: ModsHubServiceMockBase = services.get(ModsHubService);

        // Act.        
        hub._onSendModPackFiles.raise({ modPack: modPack.Name, data: { Type: CollectionChangeType.Reset, NewItems: [modFile2, modFile] } });

        // Assert.        
        strict.deepEqual([...viewModel.files], []);
    });

    it('when mod pack selected mod files requested', function () {
        // Arrange.
        let services = new ModsPageTestServiceLocator();

        let mainViewModel: ModsViewModel = services.get(ModsViewModel);
        let viewModel = mainViewModel.modPackFilesViewModel;

        let hub: ModsHubServiceMockBase = services.get(ModsHubService);
        hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: modPacks });

        let modPackViewModel = mainViewModel.modPacksViewModel;

        // Act.        
        modPackViewModel.setSelectModPack(modPack);

        // Assert.        
        hub.assertMethodCalled('requestModPackFiles', modPack.Name);
        strict.equal(viewModel.isModPackSelected, true);
        strict.equal(viewModel.selectedModPack, modPack.Name);
        strict.equal(viewModel.title, modPack.Name);
    });

    it('when different mod pack selected mod files requested', function () {
        // Arrange.
        let services = new ModsPageTestServiceLocator();

        let mainViewModel: ModsViewModel = services.get(ModsViewModel);
        let viewModel = mainViewModel.modPackFilesViewModel;

        let hub: ModsHubServiceMockBase = services.get(ModsHubService);
        hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: modPacks });

        let modPackViewModel = mainViewModel.modPacksViewModel;
        modPackViewModel.setSelectModPack(modPack);

        // Act.        
        modPackViewModel.setSelectModPack(modPack2);

        // Assert.        
        hub.assertMethodCalled('requestModPackFiles', modPack2.Name);
        strict.equal(viewModel.isModPackSelected, true);
        strict.equal(viewModel.selectedModPack, modPack2.Name);
        strict.equal(viewModel.title, modPack2.Name);
    });

    describe('upload files command', function () {
        const file1 = { name: 'file1' } as File;
        const file2 = { name: 'file2' } as File;
        const file3 = { name: 'file3' } as File;
        const files: File[] = [file1, file2, file3];

        it('uploads files', async function () {
            // Arrange.
            let services = new ModsPageTestServiceLocator();

            let mainViewModel: ModsViewModel = services.get(ModsViewModel);
            let viewModel = mainViewModel.modPackFilesViewModel;

            let hub: ModsHubServiceMockBase = services.get(ModsHubService);
            hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: modPacks });

            let modPackViewModel = mainViewModel.modPacksViewModel;
            modPackViewModel.setSelectModPack(modPack);

            let fileSelectionService: FileSelectionServiceMockBase = services.get(FileSelectionService);
            fileSelectionService._filesToReturn = files;

            let uploadService: UploadServiceMockBase = services.get(UploadService);
            let errorService: ErrorServiceMockBase = services.get(ErrorService);

            // Act.
            strict.equal(viewModel.uploadFilesCommand.canExecute(), true);
            viewModel.uploadFilesCommand.execute();

            await PromiseHelper.delay(0);

            // Assert.
            let uploadServiceMethodsCalled = uploadService.methodsCalled;
            strict.equal(uploadServiceMethodsCalled.length, 1);

            let uploadMethodCall = uploadServiceMethodsCalled[0];
            strict.equal(uploadMethodCall.name, 'uploadFormData');
            strict.equal(uploadMethodCall.args[0], ModsService.fileUploadUrl);

            let formData = uploadMethodCall.args[1] as FormDataMock;
            let actualFiles = formData._entries.get('files');
            strict.deepEqual(actualFiles, files);

            strict.equal(errorService.methodsCalled.length, 0);
        });

        it('execute no files', async function () {
            // Arrange.
            let services = new ModsPageTestServiceLocator();

            let mainViewModel: ModsViewModel = services.get(ModsViewModel);
            let viewModel = mainViewModel.modPackFilesViewModel;

            let hub: ModsHubServiceMockBase = services.get(ModsHubService);
            hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: modPacks });

            let modPackViewModel = mainViewModel.modPacksViewModel;
            modPackViewModel.setSelectModPack(modPack);

            let fileSelectionService: FileSelectionServiceMockBase = services.get(FileSelectionService);
            fileSelectionService._filesToReturn = [];

            let uploadService: UploadServiceMockBase = services.get(UploadService);
            let errorService: ErrorServiceMockBase = services.get(ErrorService);

            // Act.
            strict.equal(viewModel.uploadFilesCommand.canExecute(), true);
            viewModel.uploadFilesCommand.execute();
            await PromiseHelper.delay(0);

            // Assert.
            uploadService.assertMethodNotCalled('uploadFormData');
            strict.equal(errorService.methodsCalled.length, 0);
            strict.equal(viewModel.isUploading.value, false);
        });

        it('uploads files reports error', async function () {
            // Arrange.
            let services = new ModsPageTestServiceLocator();

            let mainViewModel: ModsViewModel = services.get(ModsViewModel);
            let viewModel = mainViewModel.modPackFilesViewModel;

            let hub: ModsHubServiceMockBase = services.get(ModsHubService);
            hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: modPacks });

            let modPackViewModel = mainViewModel.modPacksViewModel;
            modPackViewModel.setSelectModPack(modPack);

            let fileSelectionService: FileSelectionServiceMockBase = services.get(FileSelectionService);
            fileSelectionService._filesToReturn = files;

            let uploadService: UploadServiceMockBase = services.get(UploadService);
            let result: Result = {
                Success: false, Errors: [{ Key: 'some error', Description: 'some description' }]
            };
            uploadService.methodCalled.subscribe(event => {
                if (event.name === 'uploadFormData') {
                    let callback: ((event: FileUploadEvent) => void) = event.args[2];
                    callback({
                        type: FileUploadEventType.end, result: result
                    });
                }
            });

            let errorService: ErrorServiceMockBase = services.get(ErrorService);

            // Act.
            strict.equal(viewModel.uploadFilesCommand.canExecute(), true);
            viewModel.uploadFilesCommand.execute();

            await PromiseHelper.delay(0);

            // Assert.
            errorService.assertMethodCalled('reportIfError', result);
            strict.equal(viewModel.isUploading.value, false);
        });

        it('uploads files reports progress', async function () {
            // Arrange.
            let services = new ModsPageTestServiceLocator();

            let mainViewModel: ModsViewModel = services.get(ModsViewModel);
            let viewModel = mainViewModel.modPackFilesViewModel;

            let hub: ModsHubServiceMockBase = services.get(ModsHubService);
            hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: modPacks });

            let modPackViewModel = mainViewModel.modPacksViewModel;
            modPackViewModel.setSelectModPack(modPack);

            let fileSelectionService: FileSelectionServiceMockBase = services.get(FileSelectionService);
            fileSelectionService._filesToReturn = files;

            let callback: ((event: FileUploadEvent) => void);
            let uploadService: UploadServiceMockBase = services.get(UploadService);
            uploadService.methodCalled.subscribe(event => {
                if (event.name === 'uploadFormData') {
                    callback = event.args[2];
                }
            });

            // Act start.
            strict.equal(viewModel.uploadFilesCommand.canExecute(), true);
            viewModel.uploadFilesCommand.execute();
            await PromiseHelper.delay(0);

            // Assert.
            strict.equal(viewModel.isUploading.value, true);
            strict.equal(viewModel.uploadProgress.value, 0);

            // Act half way.
            callback({ type: FileUploadEventType.progress, loaded: 0.5, total: 1 });
            await PromiseHelper.delay(0);

            // Assert.
            strict.equal(viewModel.uploadProgress.value, 0.5);

            // Act end.
            callback({ type: FileUploadEventType.end, loaded: 1, total: 1, result: { Success: true } });
            await PromiseHelper.delay(0);

            // Assert.
            strict.equal(viewModel.isUploading.value, false);
        });

        it('can not execute when no mod pack selected', function () {
            // Arrange.
            let services = new ModsPageTestServiceLocator();

            let mainViewModel: ModsViewModel = services.get(ModsViewModel);
            let viewModel = mainViewModel.modPackFilesViewModel;

            let fileSelectionService: FileSelectionServiceMockBase = services.get(FileSelectionService);
            let errorService: ErrorServiceMockBase = services.get(ErrorService);

            // Act.
            strict.equal(viewModel.uploadFilesCommand.canExecute(), false);
            viewModel.uploadFilesCommand.execute();

            // Assert.            
            fileSelectionService.assertMethodNotCalled('getFiles');
            strict.equal(errorService.methodsCalled.length, 0);
        });

        it('can not execute when uploading', async function () {
            // Arrange.
            let services = new ModsPageTestServiceLocator();

            let mainViewModel: ModsViewModel = services.get(ModsViewModel);
            let viewModel = mainViewModel.modPackFilesViewModel;

            let hub: ModsHubServiceMockBase = services.get(ModsHubService);
            hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: modPacks });

            let modPackViewModel = mainViewModel.modPacksViewModel;
            modPackViewModel.setSelectModPack(modPack);

            let fileSelectionService: FileSelectionServiceMockBase = services.get(FileSelectionService);
            fileSelectionService._filesToReturn = files;

            let called = false;
            viewModel.uploadFilesCommand.canExecuteChanged.subscribe(() => called = true);

            // Act.
            viewModel.uploadFilesCommand.execute();
            await PromiseHelper.delay(0);

            // Assert.
            strict.equal(viewModel.isUploading.value, true);
            strict.equal(viewModel.uploadFilesCommand.canExecute(), false);
            strict.equal(called, true);
        });
    });

    describe('download files command', function () {
        const file1 = { name: 'file1' } as File;
        const file2 = { name: 'file2' } as File;
        const file3 = { name: 'file3' } as File;
        const files: File[] = [file1, file2, file3];

        it('downloads files', async function () {
            // Arrange.
            let services = new ModsPageTestServiceLocator();

            let mainViewModel: ModsViewModel = services.get(ModsViewModel);
            let viewModel = mainViewModel.modPackFilesViewModel;

            let hub: ModsHubServiceMockBase = services.get(ModsHubService);
            hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: modPacks });

            let modPackViewModel = mainViewModel.modPacksViewModel;
            modPackViewModel.setSelectModPack(modPack);

            let fileSelectionService: FileSelectionServiceMockBase = services.get(FileSelectionService);
            fileSelectionService._filesToReturn = files;

            // Act.
            strict.equal(viewModel.downloadFilesCommand.canExecute(), true);
            viewModel.downloadFilesCommand.execute();
            await PromiseHelper.delay(0);

            // Assert.
            hub.assertMethodCalled('downloadFromModPortal', modPack.Name, [file1.name, file2.name, file3.name]);
        });

        it('execute no files', async function () {
            // Arrange.
            let services = new ModsPageTestServiceLocator();

            let mainViewModel: ModsViewModel = services.get(ModsViewModel);
            let viewModel = mainViewModel.modPackFilesViewModel;

            let hub: ModsHubServiceMockBase = services.get(ModsHubService);
            hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: modPacks });

            let modPackViewModel = mainViewModel.modPacksViewModel;
            modPackViewModel.setSelectModPack(modPack);

            let fileSelectionService: FileSelectionServiceMockBase = services.get(FileSelectionService);
            fileSelectionService._filesToReturn = [];

            // Act.
            strict.equal(viewModel.downloadFilesCommand.canExecute(), true);
            viewModel.downloadFilesCommand.execute();
            await PromiseHelper.delay(0);

            // Assert.
            hub.assertMethodNotCalled('downloadFromModPortal');
            strict.equal(viewModel.isDownloading.value, false);
        });

        it('download files reports progress', async function () {
            // Arrange.
            let services = new ModsPageTestServiceLocator();

            let mainViewModel: ModsViewModel = services.get(ModsViewModel);
            let viewModel = mainViewModel.modPackFilesViewModel;

            let hub: ModsHubServiceMockBase = services.get(ModsHubService);
            hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: modPacks });

            let modPackViewModel = mainViewModel.modPacksViewModel;
            modPackViewModel.setSelectModPack(modPack);

            let fileSelectionService: FileSelectionServiceMockBase = services.get(FileSelectionService);
            fileSelectionService._filesToReturn = files;

            // Act start.
            strict.equal(viewModel.downloadFilesCommand.canExecute(), true);
            viewModel.downloadFilesCommand.execute();
            await PromiseHelper.delay(0);

            // Assert.
            strict.equal(viewModel.isDownloading.value, true);

            // Act end
            hub._onEndDownloadFromModPortal.raise({ Success: true });
            await PromiseHelper.delay(0);

            // Assert.
            strict.equal(viewModel.isDownloading.value, false);
        });

        it('can not execute when no mod pack selected', function () {
            // Arrange.
            let services = new ModsPageTestServiceLocator();

            let mainViewModel: ModsViewModel = services.get(ModsViewModel);
            let viewModel = mainViewModel.modPackFilesViewModel;

            let hub: ModsHubServiceMockBase = services.get(ModsHubService);

            // Act.
            strict.equal(viewModel.downloadFilesCommand.canExecute(), false);
            viewModel.downloadFilesCommand.execute();

            // Assert.            
            hub.assertMethodNotCalled('downloadFromModPortal');
        });

        it('can not execute when downloading', async function () {
            // Arrange.
            let services = new ModsPageTestServiceLocator();

            let mainViewModel: ModsViewModel = services.get(ModsViewModel);
            let viewModel = mainViewModel.modPackFilesViewModel;

            let hub: ModsHubServiceMockBase = services.get(ModsHubService);
            hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: modPacks });

            let modPackViewModel = mainViewModel.modPacksViewModel;
            modPackViewModel.setSelectModPack(modPack);

            let fileSelectionService: FileSelectionServiceMockBase = services.get(FileSelectionService);
            fileSelectionService._filesToReturn = files;

            let called = false;
            viewModel.downloadFilesCommand.canExecuteChanged.subscribe(() => called = true);

            // Act.
            viewModel.downloadFilesCommand.execute();
            await PromiseHelper.delay(0);

            // Assert.
            strict.equal(viewModel.isDownloading.value, true);
            strict.equal(called, true);
            strict.equal(viewModel.downloadFilesCommand.canExecute(), false);
        });
    });

    describe('delete files command', function () {
        it('can delete file', function () {
            // Arrange.
            let services = new ModsPageTestServiceLocator();

            let mainViewModel: ModsViewModel = services.get(ModsViewModel);
            let viewModel = mainViewModel.modPackFilesViewModel;

            let hub: ModsHubServiceMockBase = services.get(ModsHubService);
            hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: modPacks });

            let modPackViewModel = mainViewModel.modPacksViewModel;
            modPackViewModel.setSelectModPack(modPack);

            hub._onSendModPackFiles.raise({ modPack: modPack.Name, data: { Type: CollectionChangeType.Reset, NewItems: modFiles } });

            viewModel.files.setSelected(modFile2.Name, true);

            // Act.
            strict.equal(true, viewModel.deleteFilesCommand.canExecute());
            viewModel.deleteFilesCommand.execute();

            // Assert.
            hub.assertMethodCalled('deleteModPackFiles', modPack.Name, [modFile2.Name]);
        });

        it('can delete files', function () {
            // Arrange.
            let services = new ModsPageTestServiceLocator();

            let mainViewModel: ModsViewModel = services.get(ModsViewModel);
            let viewModel = mainViewModel.modPackFilesViewModel;

            let hub: ModsHubServiceMockBase = services.get(ModsHubService);
            hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: modPacks });

            let modPackViewModel = mainViewModel.modPacksViewModel;
            modPackViewModel.setSelectModPack(modPack);

            hub._onSendModPackFiles.raise({ modPack: modPack.Name, data: { Type: CollectionChangeType.Reset, NewItems: modFiles } });

            viewModel.files.selectAll();

            // Act.
            strict.equal(true, viewModel.deleteFilesCommand.canExecute());
            viewModel.deleteFilesCommand.execute();

            // Assert.
            hub.assertMethodCalled('deleteModPackFiles', modPack.Name, [modFile.Name, modFile2.Name, modFile3.Name]);
        });

        it('can not execute when no files selected', function () {
            // Arrange.
            let services = new ModsPageTestServiceLocator();

            let mainViewModel: ModsViewModel = services.get(ModsViewModel);
            let viewModel = mainViewModel.modPackFilesViewModel;

            let hub: ModsHubServiceMockBase = services.get(ModsHubService);
            hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: modPacks });

            let modPackViewModel = mainViewModel.modPacksViewModel;
            modPackViewModel.setSelectModPack(modPack);

            hub._onSendModPackFiles.raise({ modPack: modPack.Name, data: { Type: CollectionChangeType.Reset, NewItems: modFiles } });

            // Act.
            strict.equal(false, viewModel.deleteFilesCommand.canExecute());
            viewModel.deleteFilesCommand.execute();

            // Assert.
            hub.assertMethodNotCalled('deleteModPackFiles');
        });

        it('can not execute when no mod pack selected', function () {
            // Arrange.
            let services = new ModsPageTestServiceLocator();

            let mainViewModel: ModsViewModel = services.get(ModsViewModel);
            let viewModel = mainViewModel.modPackFilesViewModel;

            let hub: ModsHubServiceMockBase = services.get(ModsHubService);
            hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: modPacks });

            // Act.
            strict.equal(false, viewModel.deleteFilesCommand.canExecute());
            viewModel.deleteFilesCommand.execute();

            // Assert.
            hub.assertMethodNotCalled('deleteModPackFiles');
        });
    });

    describe('move files command', function () {
        it('can move file', function () {
            // Arrange.
            let services = new ModsPageTestServiceLocator();

            let mainViewModel: ModsViewModel = services.get(ModsViewModel);
            let viewModel = mainViewModel.modPackFilesViewModel;

            let hub: ModsHubServiceMockBase = services.get(ModsHubService);
            hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: modPacks });

            let modPackViewModel = mainViewModel.modPacksViewModel;
            modPackViewModel.setSelectModPack(modPack);

            hub._onSendModPackFiles.raise({ modPack: modPack.Name, data: { Type: CollectionChangeType.Reset, NewItems: modFiles } });

            viewModel.files.setSelected(modFile2.Name, true);
            viewModel.modPacks.setSingleSelected(modPack2.Name);

            // Act.
            strict.equal(true, viewModel.moveFilesCommand.canExecute());
            viewModel.moveFilesCommand.execute();

            // Assert.
            hub.assertMethodCalled('moveModPackFiles', modPack.Name, modPack2.Name, [modFile2.Name]);
        });

        it('can move files', function () {
            // Arrange.
            let services = new ModsPageTestServiceLocator();

            let mainViewModel: ModsViewModel = services.get(ModsViewModel);
            let viewModel = mainViewModel.modPackFilesViewModel;

            let hub: ModsHubServiceMockBase = services.get(ModsHubService);
            hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: modPacks });

            let modPackViewModel = mainViewModel.modPacksViewModel;
            modPackViewModel.setSelectModPack(modPack);

            hub._onSendModPackFiles.raise({ modPack: modPack.Name, data: { Type: CollectionChangeType.Reset, NewItems: modFiles } });

            viewModel.files.selectAll();
            viewModel.modPacks.setSingleSelected(modPack3.Name);

            // Act.
            strict.equal(true, viewModel.moveFilesCommand.canExecute());
            viewModel.moveFilesCommand.execute();

            // Assert.
            hub.assertMethodCalled('moveModPackFiles', modPack.Name, modPack3.Name, [modFile.Name, modFile2.Name, modFile3.Name]);
        });

        it('can not execute when no files selected', function () {
            // Arrange.
            let services = new ModsPageTestServiceLocator();

            let mainViewModel: ModsViewModel = services.get(ModsViewModel);
            let viewModel = mainViewModel.modPackFilesViewModel;

            let hub: ModsHubServiceMockBase = services.get(ModsHubService);
            hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: modPacks });

            let modPackViewModel = mainViewModel.modPacksViewModel;
            modPackViewModel.setSelectModPack(modPack);

            hub._onSendModPackFiles.raise({ modPack: modPack.Name, data: { Type: CollectionChangeType.Reset, NewItems: modFiles } });

            // Act.
            strict.equal(false, viewModel.moveFilesCommand.canExecute());
            viewModel.moveFilesCommand.execute();

            // Assert.
            hub.assertMethodNotCalled('moveModPackFiles');
        });

        it('can not execute when no mod pack selected', function () {
            // Arrange.
            let services = new ModsPageTestServiceLocator();

            let mainViewModel: ModsViewModel = services.get(ModsViewModel);
            let viewModel = mainViewModel.modPackFilesViewModel;

            let hub: ModsHubServiceMockBase = services.get(ModsHubService);
            hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: modPacks });

            // Act.
            strict.equal(false, viewModel.moveFilesCommand.canExecute());
            viewModel.moveFilesCommand.execute();

            // Assert.
            hub.assertMethodNotCalled('moveModPackFiles');
        });

        it('can not execute when no destination mod pack selected', function () {
            // Arrange.
            let services = new ModsPageTestServiceLocator();

            let mainViewModel: ModsViewModel = services.get(ModsViewModel);
            let viewModel = mainViewModel.modPackFilesViewModel;

            let hub: ModsHubServiceMockBase = services.get(ModsHubService);
            hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: [modPack] });

            let modPackViewModel = mainViewModel.modPacksViewModel;
            modPackViewModel.setSelectModPack(modPack);

            hub._onSendModPackFiles.raise({ modPack: modPack.Name, data: { Type: CollectionChangeType.Reset, NewItems: modFiles } });

            viewModel.files.selectAll();

            // Act.
            strict.equal(false, viewModel.moveFilesCommand.canExecute());
            viewModel.moveFilesCommand.execute();

            // Assert.
            hub.assertMethodNotCalled('moveModPackFiles');
        });
    });

    describe('copy files command', function () {
        it('can copy file', function () {
            // Arrange.
            let services = new ModsPageTestServiceLocator();

            let mainViewModel: ModsViewModel = services.get(ModsViewModel);
            let viewModel = mainViewModel.modPackFilesViewModel;

            let hub: ModsHubServiceMockBase = services.get(ModsHubService);
            hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: modPacks });

            let modPackViewModel = mainViewModel.modPacksViewModel;
            modPackViewModel.setSelectModPack(modPack);

            hub._onSendModPackFiles.raise({ modPack: modPack.Name, data: { Type: CollectionChangeType.Reset, NewItems: modFiles } });

            viewModel.files.setSelected(modFile2.Name, true);
            viewModel.modPacks.setSingleSelected(modPack2.Name);

            // Act.
            strict.equal(true, viewModel.copyFilesCommand.canExecute());
            viewModel.copyFilesCommand.execute();

            // Assert.
            hub.assertMethodCalled('copyModPackFiles', modPack.Name, modPack2.Name, [modFile2.Name]);
        });

        it('can copy files', function () {
            // Arrange.
            let services = new ModsPageTestServiceLocator();

            let mainViewModel: ModsViewModel = services.get(ModsViewModel);
            let viewModel = mainViewModel.modPackFilesViewModel;

            let hub: ModsHubServiceMockBase = services.get(ModsHubService);
            hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: modPacks });

            let modPackViewModel = mainViewModel.modPacksViewModel;
            modPackViewModel.setSelectModPack(modPack);

            hub._onSendModPackFiles.raise({ modPack: modPack.Name, data: { Type: CollectionChangeType.Reset, NewItems: modFiles } });

            viewModel.files.selectAll();
            viewModel.modPacks.setSingleSelected(modPack3.Name);

            // Act.
            strict.equal(true, viewModel.copyFilesCommand.canExecute());
            viewModel.copyFilesCommand.execute();

            // Assert.
            hub.assertMethodCalled('copyModPackFiles', modPack.Name, modPack3.Name, [modFile.Name, modFile2.Name, modFile3.Name]);
        });

        it('can not execute when no files selected', function () {
            // Arrange.
            let services = new ModsPageTestServiceLocator();

            let mainViewModel: ModsViewModel = services.get(ModsViewModel);
            let viewModel = mainViewModel.modPackFilesViewModel;

            let hub: ModsHubServiceMockBase = services.get(ModsHubService);
            hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: modPacks });

            let modPackViewModel = mainViewModel.modPacksViewModel;
            modPackViewModel.setSelectModPack(modPack);

            hub._onSendModPackFiles.raise({ modPack: modPack.Name, data: { Type: CollectionChangeType.Reset, NewItems: modFiles } });

            // Act.
            strict.equal(false, viewModel.copyFilesCommand.canExecute());
            viewModel.copyFilesCommand.execute();

            // Assert.
            hub.assertMethodNotCalled('copyModPackFiles');
        });

        it('can not execute when no mod pack selected', function () {
            // Arrange.
            let services = new ModsPageTestServiceLocator();

            let mainViewModel: ModsViewModel = services.get(ModsViewModel);
            let viewModel = mainViewModel.modPackFilesViewModel;

            let hub: ModsHubServiceMockBase = services.get(ModsHubService);
            hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: modPacks });

            // Act.
            strict.equal(false, viewModel.copyFilesCommand.canExecute());
            viewModel.copyFilesCommand.execute();

            // Assert.
            hub.assertMethodNotCalled('copyModPackFiles');
        });

        it('can not execute when no destination mod pack selected', function () {
            // Arrange.
            let services = new ModsPageTestServiceLocator();

            let mainViewModel: ModsViewModel = services.get(ModsViewModel);
            let viewModel = mainViewModel.modPackFilesViewModel;

            let hub: ModsHubServiceMockBase = services.get(ModsHubService);
            hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: [modPack] });

            let modPackViewModel = mainViewModel.modPacksViewModel;
            modPackViewModel.setSelectModPack(modPack);

            hub._onSendModPackFiles.raise({ modPack: modPack.Name, data: { Type: CollectionChangeType.Reset, NewItems: modFiles } });

            viewModel.files.selectAll();

            // Act.
            strict.equal(false, viewModel.copyFilesCommand.canExecute());
            viewModel.copyFilesCommand.execute();

            // Assert.
            hub.assertMethodNotCalled('copyModPackFiles');
        });
    });

    describe('destination mod packs', function () {
        it('does not contain selected mod pack', function () {
            // Arrange.
            let services = new ModsPageTestServiceLocator();

            let mainViewModel: ModsViewModel = services.get(ModsViewModel);
            let viewModel = mainViewModel.modPackFilesViewModel;

            let hub: ModsHubServiceMockBase = services.get(ModsHubService);
            hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: modPacks });

            let modPackViewModel = mainViewModel.modPacksViewModel;

            // Act.
            modPackViewModel.setSelectModPack(modPack);

            // Assert.
            strict.deepEqual([...viewModel.modPacks], [modPack3, modPack2]);
        });

        it('changes items when selected mod pack changes', function () {
            // Arrange.
            let services = new ModsPageTestServiceLocator();

            let mainViewModel: ModsViewModel = services.get(ModsViewModel);
            let viewModel = mainViewModel.modPackFilesViewModel;

            let hub: ModsHubServiceMockBase = services.get(ModsHubService);
            hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: modPacks });

            let modPackViewModel = mainViewModel.modPacksViewModel;
            modPackViewModel.setSelectModPack(modPack);
            strict.deepEqual([...viewModel.modPacks], [modPack3, modPack2]);

            // Act.
            modPackViewModel.setSelectModPack(modPack2);

            // Assert.
            strict.deepEqual([...viewModel.modPacks], [modPack3, modPack]);
        });

        it('sorted same as mod packs', function () {
            // Arrange.
            let services = new ModsPageTestServiceLocator();

            let mainViewModel: ModsViewModel = services.get(ModsViewModel);
            let viewModel = mainViewModel.modPackFilesViewModel;

            let hub: ModsHubServiceMockBase = services.get(ModsHubService);
            hub._onSendModPacks.raise({ Type: CollectionChangeType.Reset, NewItems: modPacks });

            // Should start sorted by LastModifiedTime descending.
            strict.deepEqual([...viewModel.modPacks], [modPack3, modPack2, modPack]);

            let sortSpec = { property: 'Name', ascending: true };
            let modPackViewModel = mainViewModel.modPacksViewModel;

            // Act.
            modPackViewModel.modPacks.sortBy(sortSpec);

            // Assert.
            strict.deepEqual(viewModel.modPacks.sortSpecifications, [sortSpec]);
            strict.deepEqual([...viewModel.modPacks], [modPack, modPack2, modPack3]);
        });
    });
});
