using Discord;
using Discord.WebSocket;
using FactorioWebInterface.Data;
using FactorioWebInterface.Models;
using FactorioWebInterface.Services.Discord;
using FactorioWebInterface.Utils;
using Moq;
using System;
using System.Threading.Tasks;
using Xunit;

namespace FactorioWebInterfaceTests.Services.Discord.DiscordServiceTests
{
    public class FactorioDiscordDataReceived : DiscordServiceTestBase
    {
        [Fact]
        public async Task RaisedWhenMessageReceived()
        {
            // Arrange.
            const string serverId = "serverId";
            const ulong channelId = 1;

            var channelMock = new Mock<ISocketMessageChannel>(MockBehavior.Strict);
            channelMock.SetupGet(x => x.Id).Returns(channelId);

            var user = new Mock<IUser>(MockBehavior.Strict).Object;
            var expectedEventArgs = new ServerMessageEventArgs(serverId, user, "message");

            var db = DbContextFactory.Create<ApplicationDbContext>();
            db.DiscordServers.Add(new DiscordServers() { ServerId = serverId, DiscordChannelId = channelId });
            await db.SaveChangesAsync();

            var messageServiceMock = new Mock<IDiscordMessageHandlingService>(MockBehavior.Strict);
            messageServiceMock.SetupAdd(x => x.MessageReceived += It.IsAny<EventHandler<IDiscordMessageHandlingService, MessageReceivedEventArgs>>());
            MessageService = messageServiceMock.Object;

            var argsSource = new TaskCompletionSource<ServerMessageEventArgs>();
            DiscordService.FactorioDiscordDataReceived += (_, e) => argsSource.SetResult(e);

            await DiscordService.Init();

            // Act.
            messageServiceMock.Raise(x => x.MessageReceived += null, MessageService, new MessageReceivedEventArgs(channelMock.Object, user, expectedEventArgs.Message));
            var actaulEventArgs = await argsSource.Task.TimeoutAfter(1000);

            // Assert.
            Assert.NotNull(actaulEventArgs);
            Assert.Equal(expectedEventArgs.ServerId, actaulEventArgs.ServerId);
            Assert.Equal(expectedEventArgs.User, actaulEventArgs.User);
            Assert.Equal(expectedEventArgs.Message, actaulEventArgs.Message);
        }

        [Fact]
        public async Task NotRaisedForNonConnectedChannel()
        {
            // Arrange.
            var messageServiceMock = new Mock<IDiscordMessageHandlingService>(MockBehavior.Strict);
            messageServiceMock.SetupAdd(x => x.MessageReceived += It.IsAny<EventHandler<IDiscordMessageHandlingService, MessageReceivedEventArgs>>());
            MessageService = messageServiceMock.Object;

            DiscordService.FactorioDiscordDataReceived += (_, __) => new InvalidOperationException();

            // Act.
            messageServiceMock.Raise(x => x.MessageReceived += null, MessageService, null);
            await Task.Delay(20);
        }
    }
}
