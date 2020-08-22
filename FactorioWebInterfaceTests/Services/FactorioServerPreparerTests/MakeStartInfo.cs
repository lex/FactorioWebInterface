using FactorioWebInterface;
using FactorioWebInterface.Hubs;
using FactorioWebInterface.Services;
using FactorioWebInterfaceTests.Utils;
using Moq;
using System.IO.Abstractions;
using System.Linq;
using Xunit;

namespace FactorioWebInterfaceTests.Services.FactorioServerPreparerTests
{
    public class MakeStartInfo
    {
        [Fact]
        public void CorrectFileName()
        {
            // Arrange.
            const string factorioWrapperPath = "FactorioWrapperPath";

            var factorioServerDataService = new Mock<IFactorioServerDataService>(MockBehavior.Strict);
            factorioServerDataService.SetupGet(x => x.FactorioWrapperPath).Returns(factorioWrapperPath);

            var factorioModManager = new Mock<IFactorioModManager>(MockBehavior.Strict);
            factorioModManager.Setup(x => x.GetModPackDirectoryInfo(It.IsAny<string>())).Returns((IDirectoryInfo?)null);

            var service = FactorioServerPreparerHelpers.MakeFactorioServerPreparer(factorioServerDataService: factorioServerDataService.Object,
                factorioModManager: factorioModManager.Object);

            var data = ServerDataHelper.MakeMutableData();

            // Act.
            var startInfo = service.MakeStartInfo(data, "startTypeArguments");

            // Assert.
            Assert.Equal(factorioWrapperPath, startInfo.FileName);
        }

        [Fact]
        public void CorrectArguments()
        {
            // Arrange.   
            const string factorioWrapperPath = "FactorioWrapperPath";

            var factorioServerDataService = new Mock<IFactorioServerDataService>(MockBehavior.Strict);
            factorioServerDataService.SetupGet(x => x.FactorioWrapperPath).Returns(factorioWrapperPath);

            var factorioModManager = new Mock<IFactorioModManager>(MockBehavior.Strict);
            factorioModManager.Setup(x => x.GetModPackDirectoryInfo(It.IsAny<string>())).Returns((IDirectoryInfo?)null);

            var service = FactorioServerPreparerHelpers.MakeFactorioServerPreparer(factorioServerDataService: factorioServerDataService.Object,
                factorioModManager: factorioModManager.Object);

            var data = ServerDataHelper.MakeMutableData();
            string startTypeArguments = Constants.FactorioLoadSaveFlag + " save_name";

            string expected = $"{data.ServerId} {data.ExecutablePath} {startTypeArguments} --server-settings {data.ServerSettingsPath} --port {data.Port} ";

            // Act.
            var startInfo = service.MakeStartInfo(data, startTypeArguments);

            // Assert.
            Assert.Equal(expected, startInfo.Arguments);
        }

        [Fact]
        public void CorrectArguments_WithModDirectory()
        {
            // Arrange.
            const string factorioWrapperPath = "FactorioWrapperPath";
            const string modDirPath = "modDirectoryPath";

            var modDirectoryMock = new Mock<IDirectoryInfo>(MockBehavior.Strict);
            modDirectoryMock.SetupGet(x => x.FullName).Returns(modDirPath);

            var factorioServerDataService = new Mock<IFactorioServerDataService>(MockBehavior.Strict);
            factorioServerDataService.SetupGet(x => x.FactorioWrapperPath).Returns(factorioWrapperPath);

            var factorioModManager = new Mock<IFactorioModManager>(MockBehavior.Strict);
            factorioModManager.Setup(x => x.GetModPackDirectoryInfo(It.IsAny<string>())).Returns(modDirectoryMock.Object);

            var service = FactorioServerPreparerHelpers.MakeFactorioServerPreparer(factorioServerDataService: factorioServerDataService.Object,
                factorioModManager: factorioModManager.Object);

            var data = ServerDataHelper.MakeMutableData();
            string startTypeArguments = Constants.FactorioLoadSaveFlag + " save_name";

            string expected = $"{data.ServerId} {data.ExecutablePath} {startTypeArguments} --server-settings {data.ServerSettingsPath} --port {data.Port} --mod-directory {modDirPath}";

            // Act.
            var startInfo = service.MakeStartInfo(data, startTypeArguments);

            // Assert.
            Assert.Equal(expected, startInfo.Arguments);
        }

        [Fact]
        public void MissingModDirectory_SetsSelectedModPackToNone()
        {
            // Arrange.
            const string factorioWrapperPath = "FactorioWrapperPath";

            var factorioServerDataService = new Mock<IFactorioServerDataService>(MockBehavior.Strict);
            factorioServerDataService.SetupGet(x => x.FactorioWrapperPath).Returns(factorioWrapperPath);

            var factorioModManager = new Mock<IFactorioModManager>(MockBehavior.Strict);
            factorioModManager.Setup(x => x.GetModPackDirectoryInfo(It.IsAny<string>())).Returns((IDirectoryInfo?)null);

            var factorioControlHub = new TestFactorioControlHub();

            var service = FactorioServerPreparerHelpers.MakeFactorioServerPreparer(
                factorioServerDataService: factorioServerDataService.Object,
                factorioModManager: factorioModManager.Object,
                factorioControlHub: factorioControlHub);

            var data = ServerDataHelper.MakeMutableData();
            data.ModPack = "some mod pack";

            string startTypeArguments = Constants.FactorioLoadSaveFlag + " save_name";

            string expected = $"{data.ServerId} {data.ExecutablePath} {startTypeArguments} --server-settings {data.ServerSettingsPath} --port {data.Port} ";

            // Act.
            var startInfo = service.MakeStartInfo(data, startTypeArguments);

            // Assert.
            Assert.Equal(expected, startInfo.Arguments);
            Assert.Equal("", data.ModPack);
            Assert.Contains(factorioControlHub.Invocations, x => x.Name == nameof(IFactorioControlClientMethods.SendSelectedModPack) && (string)x.Arguments[0]! == "");
        }
    }
}
