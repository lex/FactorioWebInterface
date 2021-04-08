using FactorioWebInterface;
using FactorioWebInterface.Models;
using FactorioWebInterface.Services;
using FactorioWebInterfaceTests.Utils;
using Moq;
using Shared;
using System.IO;
using System.IO.Abstractions;
using System.Threading.Tasks;
using Xunit;

namespace FactorioWebInterfaceTests.Services.FactorioServerPreparerTests
{
    public class PrepareLoadSave
    {
        [Fact]
        public async Task ReturnsCorrectStartInfo()
        {
            // Arrange.            
            var data = ServerDataHelper.MakeMutableData();
            data.Status = FactorioServerStatus.Stopped;
            data.ServerExtraSettings.BuildBansFromDatabaseOnStart = true;
            data.ServerSettings = new FactorioServerSettings() { UseDefaultAdmins = true };

            const string factorioWrapperPath = "FactorioWrapperPath";
            const string directoryName = Constants.LocalSavesDirectoryName;
            const string fileName = "file.zip";
            string startTypeArguments = $"{Constants.FactorioLoadSaveFlag} {Path.Combine(data.TempSavesDirectoryPath, fileName)}";

            var fileInfoMock = new Mock<IFileInfo>(MockBehavior.Strict);
            fileInfoMock.SetupGet(x => x.Directory.Name).Returns(directoryName).Verifiable();
            fileInfoMock.SetupGet(x => x.Name).Returns(fileName).Verifiable();
            var copyFileInfoMock = new Mock<IFileInfo>(MockBehavior.Loose);
            fileInfoMock.Setup(x => x.CopyTo(It.IsAny<string>(), true)).Returns(copyFileInfoMock.Object).Verifiable();

            var factorioServerDataService = new Mock<IFactorioServerDataService>(MockBehavior.Strict);
            factorioServerDataService.SetupGet(x => x.FactorioWrapperPath).Returns(factorioWrapperPath).Verifiable();

            var banServiceMock = new Mock<IFactorioBanService>(MockBehavior.Strict);
            banServiceMock.Setup(x => x.BuildBanList(data.ServerBanListPath)).Returns(Task.FromResult(Result.OK)).Verifiable();

            var adminServiceMock = new Mock<IFactorioAdminService>(MockBehavior.Strict);
            adminServiceMock.Setup(x => x.BuildAdminList(data)).Returns(Task.FromResult(Result.OK)).Verifiable();

            var fileManagerMock = new Mock<IFactorioFileManager>(MockBehavior.Strict);
            fileManagerMock.Setup(x => x.EnsureScenarioDirectoryRemoved(data.LocalScenarioDirectoryPath)).Verifiable();
            fileManagerMock.Setup(x => x.RotateFactorioLogs(data)).Returns(Result.OK).Verifiable();
            fileManagerMock.Setup(x => x.RotateChatLogs(data)).Returns(Result.OK).Verifiable();
            fileManagerMock.Setup(x => x.GetSaveFile(data.ServerId, directoryName, fileName)).Returns(fileInfoMock.Object).Verifiable();
            fileManagerMock.Setup(x => x.RaiseTempFilesChanged(It.IsAny<FilesChangedEventArgs>())).Verifiable();
            fileManagerMock.Setup(x => x.BuildServerRunningSettings(data.Constants)).Returns(Result.OK).Verifiable();

            var factorioControlHub = new TestFactorioControlHub();

            var service = FactorioServerPreparerHelpers.MakeFactorioServerPreparer(
                factorioServerDataService: factorioServerDataService.Object,
                factorioBanService: banServiceMock.Object,
                factorioAdminService: adminServiceMock.Object,
                factorioFileManager: fileManagerMock.Object,
                factorioControlHub: factorioControlHub);

            string expected = $"{data.ServerId} {data.ExecutablePath} {startTypeArguments} --server-settings {data.ServerSettingsPath} --port {data.Port} ";

            // Act.
            var result = await service.PrepareLoadSave(data, directoryName, fileName);

            // Assert.
            fileInfoMock.Verify();
            factorioServerDataService.Verify();
            banServiceMock.Verify();
            adminServiceMock.Verify();
            fileManagerMock.Verify();

            Assert.True(result.Success);
            var startInfo = result.Value;
            Assert.Equal(factorioWrapperPath, startInfo!.FileName);
            Assert.Equal(expected, startInfo.Arguments);

            var calls = factorioControlHub.Invocations;
            Assert.NotEmpty(calls);
            factorioControlHub.AssertContainsMessage(data.ServerId, MessageType.Status, $"[STATUS] Change from {FactorioServerStatus.Stopped} to {FactorioServerStatus.Preparing}");
            factorioControlHub.AssertContainsMessage(data.ServerId, MessageType.Status, $"[STATUS] Change from {FactorioServerStatus.Preparing} to {FactorioServerStatus.Prepared}");

            factorioControlHub.AssertContainsMessage(data.ServerId, MessageType.Output, $"Copying save file {directoryName}/{fileName} into Temp Saves.");
            factorioControlHub.AssertContainsMessage(data.ServerId, MessageType.Output, "Building Ban list.");
            factorioControlHub.AssertContainsMessage(data.ServerId, MessageType.Output, "Building Admin list.");
            factorioControlHub.AssertContainsMessage(data.ServerId, MessageType.Output, "Rotating logs.");
            factorioControlHub.AssertContainsMessage(data.ServerId, MessageType.Output, "Building server running settings.");
        }

        [Fact]
        public async Task FailsCorrectly()
        {
            // Arrange.            
            var data = ServerDataHelper.MakeMutableData();
            data.Status = FactorioServerStatus.Stopped;
            data.ServerExtraSettings.BuildBansFromDatabaseOnStart = true;
            data.ServerSettings = new FactorioServerSettings() { UseDefaultAdmins = true };

            const string directoryName = "wrong_directory";
            const string fileName = "file.zip";

            var fileInfoMock = new Mock<IFileInfo>(MockBehavior.Strict);
            fileInfoMock.SetupGet(x => x.Directory.Name).Returns(directoryName).Verifiable();

            var fileManagerMock = new Mock<IFactorioFileManager>(MockBehavior.Strict);
            fileManagerMock.Setup(x => x.GetSaveFile(data.ServerId, directoryName, fileName)).Returns(fileInfoMock.Object).Verifiable();

            var factorioControlHub = new TestFactorioControlHub();

            var service = FactorioServerPreparerHelpers.MakeFactorioServerPreparer(
                factorioFileManager: fileManagerMock.Object,
                factorioControlHub: factorioControlHub);

            // Act.
            var result = await service.PrepareLoadSave(data, directoryName, fileName);

            // Assert.
            fileManagerMock.Verify();

            Assert.False(result.Success);
            Assert.Equal($"{Constants.InvalidDirectoryErrorKey}: Directory name: {directoryName}, File name: {fileName}", result.ToString());

            var calls = factorioControlHub.Invocations;
            Assert.NotEmpty(calls);
            factorioControlHub.AssertContainsMessage(data.ServerId, MessageType.Status, $"[STATUS] Change from {FactorioServerStatus.Stopped} to {FactorioServerStatus.Preparing}");
            factorioControlHub.AssertContainsMessage(data.ServerId, MessageType.Status, $"[STATUS] Change from {FactorioServerStatus.Preparing} to {FactorioServerStatus.Errored}");
        }
    }
}
