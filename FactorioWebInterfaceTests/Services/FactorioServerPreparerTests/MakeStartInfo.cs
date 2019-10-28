using FactorioWebInterface;
using FactorioWebInterface.Models;
using FactorioWebInterface.Services;
using FactorioWebInterfaceTests.Utils;
using Moq;
using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Abstractions;
using System.Reflection.Metadata;
using System.Text;
using Xunit;

namespace FactorioWebInterfaceTests.Services.FactorioServerPreparerTests
{
    public class MakeStartInfo
    {
        [Fact]
        public void CorrectFileName()
        {
            // Arrange.
            var factorioServerDataService = new Mock<IFactorioServerDataService>(MockBehavior.Strict);
            factorioServerDataService.SetupGet(x => x.FactorioWrapperPath).Returns("FactorioWrapperPath");

            var factorioModManager = new Mock<IFactorioModManager>(MockBehavior.Strict);
            factorioModManager.Setup(x => x.GetModPackDirectoryInfo(It.IsAny<string>())).Returns((IDirectoryInfo)null);

            var service = FactorioServerPreparerHelpers.MakeFactorioServerPreparer(factorioServerDataService: factorioServerDataService.Object,
                factorioModManager: factorioModManager.Object);

            var data = ServerDataHelper.MakeMutableData();

            // Act.
            var startInfo = service.MakeStartInfo(data, "startTypeArguments");

            // Assert.
            Assert.Equal(Constants.DotNetPath, startInfo.FileName);
        }

        [Fact]
        public void CorrectArguments()
        {
            // Arrange.
            const string factorioWrapperPath = "FactorioWrapperPath";

            var factorioServerDataService = new Mock<IFactorioServerDataService>(MockBehavior.Strict);
            factorioServerDataService.SetupGet(x => x.FactorioWrapperPath).Returns(factorioWrapperPath);

            var factorioModManager = new Mock<IFactorioModManager>(MockBehavior.Strict);
            factorioModManager.Setup(x => x.GetModPackDirectoryInfo(It.IsAny<string>())).Returns((IDirectoryInfo)null);

            var service = FactorioServerPreparerHelpers.MakeFactorioServerPreparer(factorioServerDataService: factorioServerDataService.Object,
                factorioModManager: factorioModManager.Object);

            var data = ServerDataHelper.MakeMutableData();
            string startTypeArguments = Constants.FactorioLoadSaveFlag + " save_name";

            string expected = $"{factorioWrapperPath} {data.ServerId} {data.ExecutablePath} {startTypeArguments} --server-settings {data.ServerSettingsPath} --port {data.Port} ";

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

            string expected = $"{factorioWrapperPath} {data.ServerId} {data.ExecutablePath} {startTypeArguments} --server-settings {data.ServerSettingsPath} --port {data.Port} --mod-directory {modDirPath}";

            // Act.
            var startInfo = service.MakeStartInfo(data, startTypeArguments);

            // Assert.
            Assert.Equal(expected, startInfo.Arguments);
        }
    }
}
