using FactorioWebInterface.Models;
using FactorioWebInterface.Services;
using FactorioWebInterfaceTests.Utils;
using Moq;
using System.Threading.Tasks;
using Xunit;

namespace FactorioWebInterfaceTests.Services.FactorioServerPreparerTests
{
    public class RotateLogs
    {
        [Fact]
        public async Task ReturnsOK_WhenRotateLogs_IsSuccessful()
        {
            // Arrange.
            var data = ServerDataHelper.MakeMutableData();
            data.ServerSettings = new FactorioServerSettings() { UseDefaultAdmins = true };

            var fileManagerMock = new Mock<IFactorioFileManager>(MockBehavior.Strict);
            fileManagerMock.Setup(x => x.RotateFactorioLogs(data)).Returns(Result.OK).Verifiable();
            fileManagerMock.Setup(x => x.RotateChatLogs(data)).Returns(Result.OK).Verifiable();

            var factorioControlHub = new TestFactorioControlHub();

            var service = FactorioServerPreparerHelpers.MakeFactorioServerPreparer(factorioFileManager: fileManagerMock.Object, factorioControlHub: factorioControlHub);

            // Act.
            var result = await service.RotateLogs(data);

            // Assert.
            fileManagerMock.Verify();
            Assert.True(result.Success);

            Assert.Single(factorioControlHub.Invocations);
            var call = factorioControlHub.Invocations[0];
            TestFactorioControlHub.AssertSendMessage(data.ServerId, MessageType.Output, "Rotating logs.", call);
        }

        [Theory]
        [InlineData(false, false)]
        [InlineData(false, true)]
        [InlineData(true, false)]
        public async Task ReturnsFailure_WhenRotateLogs_IsNotSuccessful(bool logSucessful, bool chatLogSucessful)
        {
            // Arrange.
            var logResult = logSucessful ? Result.OK : Result.Failure("Some Key", "Log error");
            var chatLogResult = chatLogSucessful ? Result.OK : Result.Failure("Some Key", "Chat Log error");

            string expectedError = Result.Combine(logResult, chatLogResult).ToString();

            var data = ServerDataHelper.MakeMutableData();
            data.ServerSettings = new FactorioServerSettings() { UseDefaultAdmins = true };

            var fileManagerMock = new Mock<IFactorioFileManager>(MockBehavior.Strict);
            fileManagerMock.Setup(x => x.RotateFactorioLogs(data)).Returns(logResult).Verifiable();
            fileManagerMock.Setup(x => x.RotateChatLogs(data)).Returns(chatLogResult).Verifiable();

            var factorioControlHub = new TestFactorioControlHub();

            var service = FactorioServerPreparerHelpers.MakeFactorioServerPreparer(factorioFileManager: fileManagerMock.Object, factorioControlHub: factorioControlHub);

            // Act.
            var result = await service.RotateLogs(data);

            // Assert.
            fileManagerMock.Verify();
            Assert.False(result.Success);
            Assert.Equal(expectedError, result.ToString());

            Assert.NotEmpty(factorioControlHub.Invocations);
            var call = factorioControlHub.Invocations[factorioControlHub.Invocations.Count - 1];
            TestFactorioControlHub.AssertSendMessage(data.ServerId, MessageType.Error, $"Error rotating logs: {expectedError}", call);
        }
    }
}
