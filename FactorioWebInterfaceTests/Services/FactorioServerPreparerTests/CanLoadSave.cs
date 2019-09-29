using FactorioWebInterface;
using FactorioWebInterface.Services;
using Moq;
using System.Data;
using System.IO;
using System.IO.Abstractions;
using Xunit;

namespace FactorioWebInterfaceTests.Services.FactorioServerPreparerTests
{
    public class CanLoadSave
    {
        [Fact]
        public void ReturnsSuccess_WhenSaveFileExists()
        {
            // Arrange.   
            var fileInfoMock = new Mock<IFileInfo>(MockBehavior.Strict);

            var fileManagerMock = new Mock<IFactorioFileManager>(MockBehavior.Strict);
            fileManagerMock.Setup(x => x.GetSaveFile(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>())).Returns(fileInfoMock.Object);

            var service = FactorioServerPreparerHelpers.MakeFactorioServerPreparer(factorioFileManager: fileManagerMock.Object);

            // Act.
            var result = service.CanLoadSave("serverId", "directory", "file");

            // Assert.
            Assert.True(result.Success);
        }

        [Fact]
        public void ReturnsFailure_WhenSaveFileDoesNotExist()
        {
            // Arrange.  
            const string directoryName = "directory";
            const string fileName = "file";
            var fileInfoMock = new Mock<IFileInfo>(MockBehavior.Strict);

            var fileManagerMock = new Mock<IFactorioFileManager>(MockBehavior.Strict);
            fileManagerMock.Setup(x => x.GetSaveFile(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>())).Returns((IFileInfo)null);

            var service = FactorioServerPreparerHelpers.MakeFactorioServerPreparer(factorioFileManager: fileManagerMock.Object);

            // Act.
            var result = service.CanLoadSave("serverId", directoryName, fileName);

            // Assert.
            Assert.False(result.Success);
            Assert.NotEmpty(result.Errors);

            var error = result.Errors[0];
            Assert.Equal(Constants.MissingFileErrorKey, error.Key);
            Assert.Equal($"File {Path.Combine(directoryName, fileName)} not found.", error.Description);
        }
    }
}
