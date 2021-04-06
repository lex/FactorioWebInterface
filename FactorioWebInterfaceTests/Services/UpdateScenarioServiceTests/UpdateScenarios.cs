using FactorioWebInterface;
using FactorioWebInterface.Models;
using FactorioWebInterface.Services;
using FactorioWebInterfaceTests.Utils;
using Microsoft.Extensions.Configuration;
using Moq;
using System.Collections.Generic;
using System.IO;
using System.IO.Abstractions;
using System.IO.Abstractions.TestingHelpers;
using System.Threading.Tasks;
using Xunit;

namespace FactorioWebInterfaceTests.Services.UpdateScenarioServiceTests
{
    public class UpdateScenarios
    {
        private const string templates = "templates";

        [Fact]
        public async Task ReturnsSuccess_WhenDownloadValid()
        {
            // Arrange.
            var fileSystem = new MockFileSystem();

            Mock<IConfiguration> config = MakeConfig(templates);
            Mock<IDownloadGitHubScenarioService> downloadService = MakeDownloadService(MakeValidDownloadResultZip());
            Mock<IFactorioFileManager> fileManager = MakeValidFileManager(fileSystem, shouldGetScenarioDirectory: true, shouldNotify: true);

            var service = new UpdateScenarioService(downloadService.Object, fileManager.Object, config.Object);

            // Act.
            Result result = await service.UpdateScenarios();

            // Assert.
            Assert.True(result.Success);
            AssertScenarioBuilt(fileSystem);
            config.Verify();
            downloadService.Verify();
            fileManager.Verify();
        }

        [Fact]
        public async Task ReturnsFailure_WhenDownloadFails()
        {
            // Arrange.
            var fileSystem = new MockFileSystem();

            Result<Stream> errorResult = Result<Stream>.Failure("");

            Mock<IConfiguration> config = MakeConfig(templates);
            Mock<IDownloadGitHubScenarioService> downloadService = MakeDownloadService(errorResult);
            Mock<IFactorioFileManager> fileManager = MakeValidFileManager(fileSystem, shouldGetScenarioDirectory: false, shouldNotify: false);

            var service = new UpdateScenarioService(downloadService.Object, fileManager.Object, config.Object);

            // Act.
            Result result = await service.UpdateScenarios();

            // Assert.
            Assert.False(result.Success);
            config.Verify();
            downloadService.Verify();
            fileManager.Verify();
        }

        private static Mock<IConfiguration> MakeConfig(string value)
        {
            var config = new Mock<IConfiguration>(MockBehavior.Strict);
            config.SetupGet(x => x[Constants.ScenarioTemplatesDirectoryNameKey])
                .Returns(value)
                .Verifiable();

            return config;
        }

        private static Mock<IDownloadGitHubScenarioService> MakeDownloadService(Result<Stream> result)
        {
            var downloadService = new Mock<IDownloadGitHubScenarioService>(MockBehavior.Strict);
            downloadService.Setup(x => x.Download())
                .Returns(Task.FromResult(result))
                .Verifiable();

            return downloadService;
        }

        private static Mock<IFactorioFileManager> MakeValidFileManager(IFileSystem fileSystem, bool shouldGetScenarioDirectory, bool shouldNotify)
        {
            var fileManager = new Mock<IFactorioFileManager>(MockBehavior.Strict);

            if (shouldGetScenarioDirectory)
            {
                var di = fileSystem.DirectoryInfo.FromDirectoryName("/scenarios");
                fileManager.Setup(x => x.GetScenariosDirectory())
                    .Returns(di)
                    .Verifiable();
            }

            if (shouldNotify)
            {
                fileManager.Setup(x => x.NotifyScenariosChanged()).Verifiable();
            }

            return fileManager;
        }

        private static Result<Stream> MakeValidDownloadResultZip()
        {
            var files = new Dictionary<string, string>()
            {
                [$"scenario/{templates}/scenario1/file.txt"] = ""
            };

            var zipStream = FileHelper.StreamFromZipFiles(files);
            return Result<Stream>.OK(zipStream);
        }

        private static void AssertScenarioBuilt(IFileSystem fileSystem)
        {
            Assert.True(fileSystem.File.Exists($"/scenarios/scenario1/file.txt"));
        }
    }
}
