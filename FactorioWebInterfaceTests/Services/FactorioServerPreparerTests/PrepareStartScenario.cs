using FactorioWebInterface;
using FactorioWebInterface.Models;
using FactorioWebInterface.Services;
using FactorioWebInterfaceTests.Utils;
using Moq;
using Shared;
using System.Data;
using System.IO.Abstractions;
using System.Threading.Tasks;
using Xunit;

namespace FactorioWebInterfaceTests.Services.FactorioServerPreparerTests
{
    public class PrepareStartScenario
    {
        [Fact]
        public async Task ReturnsCorrectStartInfo()
        {
            // Arrange.            
            var data = ServerDataHelper.MakeMutableData();
            data.Status = FactorioServerStatus.Stopped;
            data.ServerExtraSettings.BuildBansFromDatabaseOnStart = true;
            data.ServerSettings = new FactorioServerSettings() { UseDefaultAdmins = true };

            const string scenarioName = "scenario";
            string startTypeArguments = $"{Constants.FactorioStartScenarioFlag} {scenarioName}";
            const string factorioWrapperPath = "FactorioWrapperPath";

            var factorioServerDataService = new Mock<IFactorioServerDataService>(MockBehavior.Strict);
            factorioServerDataService.SetupGet(x => x.FactorioWrapperPath).Returns(factorioWrapperPath).Verifiable();

            var factorioModManager = new Mock<IFactorioModManager>(MockBehavior.Strict);
            factorioModManager.Setup(x => x.GetModPackDirectoryInfo(It.IsAny<string>())).Returns((IDirectoryInfo?)null).Verifiable();

            var banServiceMock = new Mock<IFactorioBanService>(MockBehavior.Strict);
            banServiceMock.Setup(x => x.BuildBanList(data.ServerBanListPath)).Returns(Task.FromResult(Result.OK)).Verifiable();

            var adminServiceMock = new Mock<IFactorioAdminService>(MockBehavior.Strict);
            adminServiceMock.Setup(x => x.BuildAdminList(data)).Returns(Task.FromResult(Result.OK)).Verifiable();

            var fileManagerMock = new Mock<IFactorioFileManager>(MockBehavior.Strict);
            fileManagerMock.Setup(x => x.ScenarioExists(scenarioName)).Returns(true).Verifiable();
            fileManagerMock.Setup(x => x.EnsureScenarioDirectoryCreated(data.LocalScenarioDirectoryPath)).Verifiable();
            fileManagerMock.Setup(x => x.RotateFactorioLogs(data)).Returns(Result.OK).Verifiable();
            fileManagerMock.Setup(x => x.RotateChatLogs(data)).Returns(Result.OK).Verifiable();
            fileManagerMock.Setup(x => x.BuildServerRunningSettings(data.Constants)).Returns(Result.OK).Verifiable();

            var factorioControlHub = new TestFactorioControlHub();

            var service = FactorioServerPreparerHelpers.MakeFactorioServerPreparer(
                factorioServerDataService: factorioServerDataService.Object,
                factorioModManager: factorioModManager.Object,
                factorioBanService: banServiceMock.Object,
                factorioAdminService: adminServiceMock.Object,
                factorioFileManager: fileManagerMock.Object,
                factorioControlHub: factorioControlHub);

            string expected = $"{data.ServerId} {data.ExecutablePath} {startTypeArguments} --server-settings {data.ServerSettingsPath} --port {data.Port} ";

            // Act.
            var result = await service.PrepareStartScenario(data, scenarioName);

            // Assert.
            factorioServerDataService.Verify();
            factorioModManager.Verify();
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
            var data = ServerDataHelper.MakeMutableData();
            data.Status = FactorioServerStatus.Stopped;
            data.ServerExtraSettings.BuildBansFromDatabaseOnStart = true;
            data.ServerSettings = new FactorioServerSettings() { UseDefaultAdmins = true };

            const string scenarioName = "scenario";
            string startTypeArguments = $"{Constants.FactorioStartScenarioFlag} {scenarioName}";

            var fileManagerMock = new Mock<IFactorioFileManager>(MockBehavior.Strict);
            fileManagerMock.Setup(x => x.ScenarioExists(scenarioName)).Returns(false).Verifiable();

            var service = FactorioServerPreparerHelpers.MakeFactorioServerPreparer(factorioFileManager: fileManagerMock.Object);

            // Act.
            var result = await service.PrepareStartScenario(data, scenarioName);

            // Assert.
            fileManagerMock.Verify();

            Assert.False(result.Success);
            Assert.Equal($"{Constants.MissingDirectoryErrorKey}: Scenario {scenarioName} not found.", result.ToString());
        }
    }
}
