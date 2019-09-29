using FactorioWebInterface.Models;
using FactorioWebInterface.Services;
using FactorioWebInterfaceTests.Utils;
using Moq;
using System.Threading.Tasks;
using Xunit;

namespace FactorioWebInterfaceTests.Services.FactorioServerPreparerTests
{
    public class BuildAdminList
    {
        [Fact]
        public async Task ReturnsOK_WhenUseDefaultAdmins_IsFalse()
        {
            // Arrange.
            var data = ServerDataHelper.MakeMutableData();
            data.ServerSettings = new FactorioServerSettings() { UseDefaultAdmins = false };

            var service = FactorioServerPreparerHelpers.MakeFactorioServerPreparer();

            // Act.
            var result = await service.BuildAdminList(data);

            // Assert.
            Assert.True(result.Success);
        }

        [Fact]
        public async Task ReturnsOK_WhenBuildAdminList_IsSuccessful()
        {
            // Arrange.
            var data = ServerDataHelper.MakeMutableData();
            data.ServerSettings = new FactorioServerSettings() { UseDefaultAdmins = true };

            var adminManagerMock = new Mock<IFactorioAdminManager>(MockBehavior.Strict);
            adminManagerMock.Setup(x => x.BuildAdminList(data)).Returns(Task.FromResult(Result.OK)).Verifiable();

            var factorioControlHub = new TestFactorioControlHub();

            var service = FactorioServerPreparerHelpers.MakeFactorioServerPreparer(factorioAdminManager: adminManagerMock.Object, factorioControlHub: factorioControlHub);

            // Act.
            var result = await service.BuildAdminList(data);

            // Assert.
            adminManagerMock.Verify();
            Assert.True(result.Success);

            Assert.Single(factorioControlHub.Invocations);
            var call = factorioControlHub.Invocations[0];
            TestFactorioControlHub.AssertSendMessage(data.ServerId, MessageType.Output, "Building Admin list.", call);
        }

        [Fact]
        public async Task ReturnsFailure_WhenBuildAdminList_IsNotSuccessful()
        {
            // Arrange.
            var data = ServerDataHelper.MakeMutableData();
            data.ServerSettings = new FactorioServerSettings() { UseDefaultAdmins = true };

            Result expectedResult = Result.Failure("Some key", "Some error");

            var adminManagerMock = new Mock<IFactorioAdminManager>(MockBehavior.Strict);
            adminManagerMock.Setup(x => x.BuildAdminList(data)).Returns(Task.FromResult(expectedResult)).Verifiable();

            var factorioControlHub = new TestFactorioControlHub();

            var service = FactorioServerPreparerHelpers.MakeFactorioServerPreparer(factorioAdminManager: adminManagerMock.Object, factorioControlHub: factorioControlHub);

            // Act.
            var result = await service.BuildAdminList(data);

            // Assert.
            adminManagerMock.Verify();
            Assert.False(result.Success);
            Assert.Equal(expectedResult, result);

            Assert.NotEmpty(factorioControlHub.Invocations);
            var call = factorioControlHub.Invocations[factorioControlHub.Invocations.Count - 1];
            TestFactorioControlHub.AssertSendMessage(data.ServerId, MessageType.Output, "Error building Admin list: Some key: Some error", call);
        }
    }
}
