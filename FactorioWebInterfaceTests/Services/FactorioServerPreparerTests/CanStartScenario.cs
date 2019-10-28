using FactorioWebInterface;
using FactorioWebInterface.Services;
using Moq;
using System;
using System.Collections.Generic;
using System.Text;
using Xunit;

namespace FactorioWebInterfaceTests.Services.FactorioServerPreparerTests
{
    public class CanStartScenario
    {
        [Fact]
        public void ReturnsSuccess_WhenScenarioExists()
        {
            // Arrange.            
            var fileManagerMock = new Mock<IFactorioFileManager>(MockBehavior.Strict);
            fileManagerMock.Setup(x => x.ScenarioExists(It.IsAny<string>())).Returns(true);

            var service = FactorioServerPreparerHelpers.MakeFactorioServerPreparer(factorioFileManager: fileManagerMock.Object);

            // Act.
            var result = service.CanStartScenario("scenarioName");

            // Assert.
            Assert.True(result.Success);
        }

        [Fact]
        public void ReturnsFailure_WhenScenarioDoesNotExist()
        {
            // Arrange. 
            const string scenarioName = "scenarioName";

            var fileManagerMock = new Mock<IFactorioFileManager>(MockBehavior.Strict);
            fileManagerMock.Setup(x => x.ScenarioExists(It.IsAny<string>())).Returns(false);

            var service = FactorioServerPreparerHelpers.MakeFactorioServerPreparer(factorioFileManager: fileManagerMock.Object);

            // Act.
            var result = service.CanStartScenario("scenarioName");

            // Assert.
            Assert.False(result.Success);
            Assert.NotEmpty(result.Errors);

            var error = result.Errors[0];
            Assert.Equal(Constants.MissingDirectoryErrorKey, error.Key);
            Assert.Equal($"Scenario {scenarioName} not found.", error.Description);
        }
    }
}
