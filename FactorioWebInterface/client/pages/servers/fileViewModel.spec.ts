import { ServersPageTestServiceLocator } from "../../testUtils/testServiceLocator";
import { ServersViewModel } from "./serversViewModel";
import { ServersHubServiceMockBase } from "../../testUtils/pages/servers/serversHubServiceMockBase";
import { ServersHubService } from "./serversHubService";
import { FileMetaData } from "./serversTypes";
import { CollectionChangeType } from "../../ts/utils";
import { strict } from "assert";
import { IterableHelper } from "../../utils/iterableHelper";
import { FileViewModel } from "./fileViewModel";
import { ServerFileService } from "./serverFileService";
import { ServerIdService } from "./serverIdService";

describe('FileViewModel', function () {
    const tempFile: FileMetaData = {
        Name: 'file.zip',
        Size: 0,
        Directory: 'saves',
        CreatedTime: '2020-01-02 00:00:00',
        LastModifiedTime: '2020-01-02 00:00:00'
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
        CreatedTime: '2020-01-02 00:00:00',
        LastModifiedTime: '2020-01-02 00:00:00'
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
        CreatedTime: '2020-01-02 00:00:00',
        LastModifiedTime: '2020-01-02 00:00:00'
    };

    const globalFile2: FileMetaData = {
        Name: 'global_file2.zip',
        Size: 0,
        Directory: 'global_saves',
        CreatedTime: '2020-01-01 00:00:00',
        LastModifiedTime: '2020-01-01 00:00:00'
    };

    const tempFiles = [tempFile, tempFile2];
    const localFiles = [localFile, localFile2];
    const globalFiles = [globalFile, globalFile2];

    it('can construct', function () {
        // Arrange.
        let services = new ServersPageTestServiceLocator();
        let serverFileService: ServerFileService = services.get(ServerFileService);
        let serverIdService: ServerIdService = services.get(ServerIdService);        

        // Act.
        let fileViewModel = new FileViewModel('Temp Saves', serverFileService.tempSaveFiles, serverIdService.currentServerId);

        // Assert.
        strict.equal(fileViewModel.count, 0);
        strict.deepEqual([...IterableHelper.map(fileViewModel.files, f => f.value)], []);
        strict.equal(fileViewModel.header, 'Temp Saves (0)');
        strict.equal(fileViewModel.serverId, serverIdService.currentServerId);
    });

    it('has initial files', function () {
        // Arrange.
        let services = new ServersPageTestServiceLocator();
        let mainViewModel: ServersViewModel = services.get(ServersViewModel);
        let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

        hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: tempFiles });
        hubService._localSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: localFiles });
        hubService._globalSaveFiles.raise({ Type: CollectionChangeType.Reset, NewItems: globalFiles });

        // Act.
        let tempFileViewModel = mainViewModel.tempFileViewModel;
        let localFileViewModel = mainViewModel.localFileViewModel;
        let globalFileViewModel = mainViewModel.globalFileViewModel;

        // Assert.
        strict.deepEqual([...IterableHelper.map(tempFileViewModel.files, f => f.value)], tempFiles);
        strict.deepEqual([...IterableHelper.map(localFileViewModel.files, f => f.value)], localFiles);
        strict.deepEqual([...IterableHelper.map(globalFileViewModel.files, f => f.value)], globalFiles);

        strict.equal(tempFileViewModel.header, 'Temp Saves (2)');
        strict.equal(localFileViewModel.header, 'Local Saves (2)');
        strict.equal(globalFileViewModel.header, 'Global Saves (2)');

        strict.equal(tempFileViewModel.count, 2);
        strict.equal(localFileViewModel.count, 2);
        strict.equal(globalFileViewModel.count, 2);
    });

    it('header shows selected file', function () {
        // Arrange.
        let services = new ServersPageTestServiceLocator();
        let mainViewModel: ServersViewModel = services.get(ServersViewModel);
        let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

        hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: tempFiles });

        let tempFileViewModel = mainViewModel.tempFileViewModel;
        let box = tempFileViewModel.files.getBoxByKey(tempFile.Name);

        // Act.
        tempFileViewModel.files.setSingleSelected(box);

        // Assert.
        strict.equal(tempFileViewModel.header, 'Temp Saves (2) - Selected: file.zip');
    });

    it('header shows multiple selected files', function () {
        // Arrange.
        let services = new ServersPageTestServiceLocator();
        let mainViewModel: ServersViewModel = services.get(ServersViewModel);
        let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

        hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: tempFiles });

        let tempFileViewModel = mainViewModel.tempFileViewModel;

        // Act.
        tempFileViewModel.files.selectAll();

        // Assert.
        strict.equal(tempFileViewModel.header, 'Temp Saves (2) - Selected: 2 saves');
    });
});