using FactorioWebInterface;
using FactorioWebInterface.Services;
using Moq;
using Xunit;

namespace FactorioWebInterfaceTests.Services.FactorioServerPreparerTests
{
    public class CanResume
    {
        [Fact]
        public void ReturnsSuccess_WhenTempFiles()
        {
            // Arrange.            
            var fileManagerMock = new Mock<IFactorioFileManager>(MockBehavior.Strict);
            fileManagerMock.Setup(x => x.HasTempSaveFiles(It.IsAny<string>())).Returns(true);

            var service = FactorioServerPreparerHelpers.MakeFactorioServerPreparer(factorioFileManager: fileManagerMock.Object);

            // Act.
            var result = service.CanResume("path");

            // Assert.
            Assert.True(result.Success);
        }

        [Fact]
        public void ReturnsFailure_WhenNoTempFiles()
        {
            // Arrange.            
            var fileManagerMock = new Mock<IFactorioFileManager>(MockBehavior.Strict);
            fileManagerMock.Setup(x => x.HasTempSaveFiles(It.IsAny<string>())).Returns(false);

            var service = FactorioServerPreparerHelpers.MakeFactorioServerPreparer(factorioFileManager: fileManagerMock.Object);

            // Act.
            var result = service.CanResume("path");

            // Assert.
            Assert.False(result.Success);
            Assert.NotEmpty(result.Errors);

            var error = result.Errors[0];
            Assert.Equal(Constants.MissingFileErrorKey, error.Key);
            Assert.Equal("No file to resume server from.", error.Description);
        }
    }
}
