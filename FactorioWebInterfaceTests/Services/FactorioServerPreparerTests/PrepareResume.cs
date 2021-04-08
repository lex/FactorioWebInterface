using FactorioWebInterface;
using FactorioWebInterface.Models;
using FactorioWebInterface.Services;
using FactorioWebInterfaceTests.Utils;
using Moq;
using Shared;
using System.IO.Abstractions;
using System.Threading.Tasks;
using Xunit;

namespace FactorioWebInterfaceTests.Services.FactorioServerPreparerTests
{
    public class PrepareResume
    {
        [Fact]
        public async Task ReturnsCorrectStartInfo()
        {
            // Arrange.            
            var data = ServerDataHelper.MakeMutableData();
            data.Status = FactorioServerStatus.Stopped;
            data.ServerExtraSettings.BuildBansFromDatabaseOnStart = true;
            data.ServerSettings = new FactorioServerSettings() { UseDefaultAdmins = true };

            const string startTypeArguments = Constants.FactorioLoadLatestSaveFlag;
            const string factorioWrapperPath = "FactorioWrapperPath";

            var factorioServerDataService = new Mock<IFactorioServerDataService>(MockBehavior.Strict);
            factorioServerDataService.SetupGet(x => x.FactorioWrapperPath).Returns(factorioWrapperPath).Verifiable();

            var banServiceMock = new Mock<IFactorioBanService>(MockBehavior.Strict);
            banServiceMock.Setup(x => x.BuildBanList(data.ServerBanListPath)).Returns(Task.FromResult(Result.OK)).Verifiable();

            var adminServiceMock = new Mock<IFactorioAdminService>(MockBehavior.Strict);
            adminServiceMock.Setup(x => x.BuildAdminList(data)).Returns(Task.FromResult(Result.OK)).Verifiable();

            var fileManagerMock = new Mock<IFactorioFileManager>(MockBehavior.Strict);
            fileManagerMock.Setup(x => x.HasTempSaveFiles(data.TempSavesDirectoryPath)).Returns(true).Verifiable();
            fileManagerMock.Setup(x => x.EnsureScenarioDirectoryRemoved(data.LocalScenarioDirectoryPath)).Verifiable();
            fileManagerMock.Setup(x => x.RotateFactorioLogs(data)).Returns(Result.OK).Verifiable();
            fileManagerMock.Setup(x => x.RotateChatLogs(data)).Returns(Result.OK).Verifiable();
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
            var result = await service.PrepareResume(data);

            // Assert.
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

            factorioControlHub.AssertContainsMessage(data.ServerId, MessageType.Output, "Building Ban list.");
            factorioControlHub.AssertContainsMessage(data.ServerId, MessageType.Output, "Building Admin list.");
            factorioControlHub.AssertContainsMessage(data.ServerId, MessageType.Output, "Rotating logs.");
            factorioControlHub.AssertContainsMessage(data.ServerId, MessageType.Output, "Building server running settings.");
        }

        [Fact]
        public async Task FailsCorrectly()
        {
            // Arrange.            
            string modPack = "missingModPack";

            var data = ServerDataHelper.MakeMutableData();
            data.Status = FactorioServerStatus.Stopped;
            data.ServerExtraSettings.BuildBansFromDatabaseOnStart = true;
            data.ServerSettings = new FactorioServerSettings() { UseDefaultAdmins = true };
            data.ModPack = modPack;

            Result banResult = Result.Failure("Ban");
            Result adminResult = Result.Failure("Admin");
            Result logResult = Result.Failure("Log");
            Result settingsResult = Result.Failure("settings");

            var factorioModManager = new Mock<IFactorioModManager>(MockBehavior.Strict);
            factorioModManager.Setup(x => x.GetModPackDirectoryInfo(It.IsAny<string>())).Returns((IDirectoryInfo?)null).Verifiable();

            var banServiceMock = new Mock<IFactorioBanService>(MockBehavior.Strict);
            banServiceMock.Setup(x => x.BuildBanList(data.ServerBanListPath)).Returns(Task.FromResult(banResult)).Verifiable();

            var adminServiceMock = new Mock<IFactorioAdminService>(MockBehavior.Strict);
            adminServiceMock.Setup(x => x.BuildAdminList(data)).Returns(Task.FromResult(adminResult)).Verifiable();

            var fileManagerMock = new Mock<IFactorioFileManager>(MockBehavior.Strict);
            fileManagerMock.Setup(x => x.HasTempSaveFiles(data.TempSavesDirectoryPath)).Returns(true).Verifiable();
            fileManagerMock.Setup(x => x.EnsureScenarioDirectoryRemoved(data.LocalScenarioDirectoryPath)).Verifiable();
            fileManagerMock.Setup(x => x.RotateFactorioLogs(data)).Returns(logResult).Verifiable();
            fileManagerMock.Setup(x => x.RotateChatLogs(data)).Returns(logResult).Verifiable();
            fileManagerMock.Setup(x => x.BuildServerRunningSettings(data.Constants)).Returns(settingsResult).Verifiable();

            var factorioControlHub = new TestFactorioControlHub();

            var service = FactorioServerPreparerHelpers.MakeFactorioServerPreparer(
                factorioModManager: factorioModManager.Object,
                factorioBanService: banServiceMock.Object,
                factorioAdminService: adminServiceMock.Object,
                factorioFileManager: fileManagerMock.Object,
                factorioControlHub: factorioControlHub);

            // Act.
            var result = await service.PrepareResume(data);

            // Assert.
            factorioModManager.Verify();
            banServiceMock.Verify();
            adminServiceMock.Verify();
            fileManagerMock.Verify();

            Assert.False(result.Success);

            var calls = factorioControlHub.Invocations;
            Assert.NotEmpty(calls);
            factorioControlHub.AssertContainsMessage(data.ServerId, MessageType.Status, $"[STATUS] Change from {FactorioServerStatus.Stopped} to {FactorioServerStatus.Preparing}");
            factorioControlHub.AssertContainsMessage(data.ServerId, MessageType.Status, $"[STATUS] Change from {FactorioServerStatus.Preparing} to {FactorioServerStatus.Errored}");

            factorioControlHub.AssertContainsMessage(data.ServerId, MessageType.Error, $"Error building Ban list: {banResult}");
            factorioControlHub.AssertContainsMessage(data.ServerId, MessageType.Error, $"Error building Admin list: {adminResult}");
            factorioControlHub.AssertContainsMessage(data.ServerId, MessageType.Error, $"Error rotating logs: {Result.Combine(logResult, logResult)}");
            factorioControlHub.AssertContainsMessage(data.ServerId, MessageType.Error, $"Error building server running settings: {settingsResult}");
            factorioControlHub.AssertContainsMessage(data.ServerId, MessageType.Error, $"Error with mod pack: The mod pack '{modPack}' was not found.");
        }
    }
}
