import { FileMetaData } from "./serversTypes";
import { ServersPageTestServiceLocator } from "../../testUtils/testServiceLocator";
import { ServerFileService } from "./serverFileService";
import { LogFileViewModel } from "./logFileViewModel";
import { IterableHelper } from "../../utils/iterableHelper";
import { strict } from "assert";
import { ServersHubServiceMockBase } from "../../testUtils/pages/servers/serversHubServiceMockBase";
import { ServersViewModel } from "./serversViewModel";
import { CollectionChangeType } from "../../ts/utils";
import { ServersHubService } from "./serversHubService";

describe('LogFileViewModel', function () {
    const logFile: FileMetaData = {
        Name: 'log.log',
        Size: 0,
        Directory: 'logs',
        CreatedTime: '2020-01-02 00:00:00',
        LastModifiedTime: '2020-01-02 00:00:00'
    };

    const logFile2: FileMetaData = {
        Name: 'log2.log',
        Size: 0,
        Directory: 'logs',
        CreatedTime: '2020-01-01 00:00:00',
        LastModifiedTime: '2020-01-01 00:00:00'
    };

    const chatLogFile: FileMetaData = {
        Name: 'chatlog.log',
        Size: 0,
        Directory: 'chat_logs',
        CreatedTime: '2020-01-02 00:00:00',
        LastModifiedTime: '2020-01-02 00:00:00'
    };

    const chatLogFile2: FileMetaData = {
        Name: 'chatlog2.log',
        Size: 0,
        Directory: 'chat_logs',
        CreatedTime: '2020-01-01 00:00:00',
        LastModifiedTime: '2020-01-01 00:00:00'
    };

    const logFiles = [logFile, logFile2];
    const chatLogFiles = [chatLogFile, chatLogFile2];

    it('can construct', function () {
        // Arrange.
        let services = new ServersPageTestServiceLocator();
        let serverFileService: ServerFileService = services.get(ServerFileService);

        // Act.
        let logFileViewModel = new LogFileViewModel('Logs', serverFileService.logFiles, 'logFile');

        // Assert.
        strict.equal(logFileViewModel.count, 0);
        strict.deepEqual([...IterableHelper.map(logFileViewModel.files, f => f.value)], []);
        strict.equal(logFileViewModel.header, 'Logs (0)');
        strict.equal(logFileViewModel.handler, 'logFile');
    });

    it('has initial files', function () {
        // Arrange.
        let services = new ServersPageTestServiceLocator();
        let mainViewModel: ServersViewModel = services.get(ServersViewModel);
        let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

        hubService._logFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: logFiles });
        hubService._chatLogsFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: chatLogFiles });

        // Act.
        let logFileViewModel = mainViewModel.logFileViewModel;
        let chatLogFileViewModel = mainViewModel.chatLogFileViewModel;

        // Assert.
        strict.deepEqual([...IterableHelper.map(logFileViewModel.files, f => f.value)], logFiles);
        strict.deepEqual([...IterableHelper.map(chatLogFileViewModel.files, f => f.value)], chatLogFiles);


        strict.equal(logFileViewModel.header, 'Logs (2)');
        strict.equal(chatLogFileViewModel.header, 'Chat Logs (2)');


        strict.equal(logFileViewModel.count, 2);
        strict.equal(chatLogFileViewModel.count, 2);
    });
});