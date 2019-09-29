using FactorioWebInterface.Models;
using FactorioWebInterface.Services;
using FactorioWebInterfaceTests.Utils;
using Moq;
using System.Threading.Tasks;
using Xunit;

namespace FactorioWebInterfaceTests.Services.FactorioServerPreparerTests
{
    public class BuildBanList
    {
        [Fact]
        public async Task ReturnsOK_WhenBuildBansFromDatabaseOnStart_IsFalse()
        {
            // Arrange.
            var data = ServerDataHelper.MakeMutableData();
            data.ServerExtraSettings.BuildBansFromDatabaseOnStart = false;

            var service = FactorioServerPreparerHelpers.MakeFactorioServerPreparer();

            // Act.
            var result = await service.BuildBanList(data);

            // Assert.
            Assert.True(result.Success);
        }

        [Fact]
        public async Task ReturnsOK_WhenBuildBanList_IsSuccessful()
        {
            // Arrange.
            var data = ServerDataHelper.MakeMutableData();
            data.ServerExtraSettings.BuildBansFromDatabaseOnStart = true;

            var banServiceMock = new Mock<IFactorioBanService>(MockBehavior.Strict);
            banServiceMock.Setup(x => x.BuildBanList(data.ServerBanListPath)).Returns(Task.FromResult(Result.OK)).Verifiable();

            var factorioControlHub = new TestFactorioControlHub();

            var service = FactorioServerPreparerHelpers.MakeFactorioServerPreparer(factorioBanService: banServiceMock.Object, factorioControlHub: factorioControlHub);

            // Act.
            var result = await service.BuildBanList(data);

            // Assert.
            banServiceMock.Verify();
            Assert.True(result.Success);

            Assert.Single(factorioControlHub.Invocations);
            var call = factorioControlHub.Invocations[0];
            TestFactorioControlHub.AssertSendMessage(data.ServerId, MessageType.Output, "Building Ban list.", call);
        }

        [Fact]
        public async Task ReturnsFailure_WhenBuildBanList_IsNotSuccessful()
        {
            // Arrange.
            var data = ServerDataHelper.MakeMutableData();
            data.ServerExtraSettings.BuildBansFromDatabaseOnStart = true;

            Result expectedResult = Result.Failure("Some key", "Some error");

            var banServiceMock = new Mock<IFactorioBanService>(MockBehavior.Strict);
            banServiceMock.Setup(x => x.BuildBanList(data.ServerBanListPath)).Returns(Task.FromResult(expectedResult)).Verifiable();

            var factorioControlHub = new TestFactorioControlHub();

            var service = FactorioServerPreparerHelpers.MakeFactorioServerPreparer(factorioBanService: banServiceMock.Object, factorioControlHub: factorioControlHub);

            // Act.
            var result = await service.BuildBanList(data);

            // Assert.
            banServiceMock.Verify();
            Assert.False(result.Success);
            Assert.Equal(expectedResult, result);

            Assert.NotEmpty(factorioControlHub.Invocations);
            var call = factorioControlHub.Invocations[factorioControlHub.Invocations.Count - 1];
            TestFactorioControlHub.AssertSendMessage(data.ServerId, MessageType.Output, "Error building Ban list: Some key: Some error", call);
        }
    }
}
