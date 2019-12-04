using FactorioWebInterface.Models;
using FactorioWebInterface.Utils;
using FactorioWebInterfaceTests.Utils;
using Shared;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Xunit;

namespace FactorioWebInterfaceTests.UtilsTests.FactorioServerUtilsTests
{
    public class ChangeStatus
    {
        private static MessageData noUserMessageData = new MessageData()
        {
            ServerId = "1",
            MessageType = MessageType.Status,
            Message = $"[STATUS] Change from {nameof(FactorioServerStatus.Unknown)} to {nameof(FactorioServerStatus.Preparing)}"
        };

        private static MessageData userMessageData = new MessageData()
        {
            ServerId = "1",
            MessageType = MessageType.Status,
            Message = $"[STATUS] Change from {nameof(FactorioServerStatus.Unknown)} to {nameof(FactorioServerStatus.Preparing)} by user User"
        };

        public static object[][] ChangeStatusCorrectTestCases => new object[][]
        {
            new object[] { noUserMessageData, "" },
            new object[] { noUserMessageData, " " },
            new object[] { noUserMessageData, null },
            new object[] { userMessageData, "User" }
        };

        [Theory]
        [MemberData(nameof(ChangeStatusCorrectTestCases))]
        public async Task ChangeStatusCorrect(MessageData expected, string byUser)
        {
            // Arrange.
            var controlHub = new TestFactorioControlHub();
            var data = ServerDataHelper.MakeMutableData(serverNumber: 1);

            // Act.
            await FactorioServerUtils.ChangeStatus(data, controlHub, FactorioServerStatus.Preparing, byUser);

            // Assert.
            var messages = data.ControlMessageBuffer.ToArray();
            Assert.NotEmpty(messages);
            var actual = messages[0];
            Assert.Equal(expected.ServerId, actual.ServerId);
            Assert.Equal(expected.MessageType, actual.MessageType);
            Assert.Equal(expected.Message, actual.Message);

            controlHub.AssertContainsStatusMessage(data.ServerId, FactorioServerStatus.Unknown, FactorioServerStatus.Preparing, byUser);
            controlHub.AssertContainsChangeStatus(FactorioServerStatus.Preparing, FactorioServerStatus.Unknown);
        }
    }
}
