using Discord;
using FactorioWebInterface;
using FactorioWebInterface.Data;
using FactorioWebInterface.Services;
using FactorioWebInterface.Services.Discord;
using FactorioWebInterface.Utils;
using Moq;
using System.Threading.Tasks;
using Xunit;

namespace FactorioWebInterfaceTests.Services.Discord.DiscordServiceTests
{
    public class SendToConnectedChannel : DiscordServiceTestBase
    {
        [Fact]
        public async Task DoesSendTextToMessageQueue()
        {
            // Arrange.
            const string serverId = "serverId";
            const ulong channelId = 1;
            const string message = "message";

            var messageSent = new TaskCompletionSource<string>();

            var db = DbContextFactory.Create<ApplicationDbContext>();
            db.DiscordServers.Add(new DiscordServers() { ServerId = serverId, DiscordChannelId = channelId });
            await db.SaveChangesAsync();

            var clientMock = MakeMockClientThatExpectGetChannel(channelId);
            Client = clientMock.Object;

            MessageQueueFactory = MakeMessageQueueFactory((s, _) => messageSent.SetResult(s));

            await DiscordService.Init();

            // Act.
            await DiscordService.SendToConnectedChannel(serverId, message);
            var actualMessage = await messageSent.Task.TimeoutAfter(1000);

            // Assert.
            Assert.Equal(message, actualMessage);
            clientMock.Verify();
        }

        [Fact]
        public async Task DoesSendEmbedToMessageQueue()
        {
            // Arrange.
            const string serverId = "serverId";
            const ulong channelId = 1;
            Embed message = new EmbedBuilder().Build();

            var messageSent = new TaskCompletionSource<Embed>();

            var db = DbContextFactory.Create<ApplicationDbContext>();
            db.DiscordServers.Add(new DiscordServers() { ServerId = serverId, DiscordChannelId = channelId });
            await db.SaveChangesAsync();

            var clientMock = MakeMockClientThatExpectGetChannel(channelId);
            Client = clientMock.Object;

            MessageQueueFactory = MakeMessageQueueFactory((_, e) => messageSent.SetResult(e));

            await DiscordService.Init();

            // Act.
            await DiscordService.SendToConnectedChannel(serverId, embed: message);
            var actualMessage = await messageSent.Task.TimeoutAfter(1000);

            // Assert.
            Assert.Equal(message, actualMessage);
            clientMock.Verify();
        }

        [Fact]
        public async Task AfterRemoveAndSet_CreatesNewMessageQueue()
        {
            // Arrange.
            const string serverId = "serverId";
            const ulong channelId = 1;

            var factorioServerDataService = new Mock<IFactorioServerDataService>(MockBehavior.Strict);
            factorioServerDataService.Setup(x => x.IsValidServerId(It.Is<string>(x => x == serverId))).Returns(true);
            FactorioServerDataService = factorioServerDataService.Object;

            var clientMock = MakeMockClientThatExpectGetChannel(channelId);
            Client = clientMock.Object;

            var queueMock = new Mock<IMessageQueue>(MockBehavior.Loose);

            int createCount = 0;
            var factoryMock = new Mock<IMessageQueueFactory>(MockBehavior.Strict);
            factoryMock.Setup(x => x.Create(It.IsAny<IMessageChannel>()))
                .Returns(queueMock.Object)
                .Callback((IMessageChannel _) => createCount++);
            MessageQueueFactory = factoryMock.Object;

            await DiscordService.Init();

            var resultSet = await DiscordService.SetServer(serverId, channelId);
            Assert.True(resultSet.Success);

            // Send dummy message to activate queue.
            await DiscordService.SendToConnectedChannel(serverId, "dummy message");
            Assert.Equal(1, createCount);

            var resultUnset = await DiscordService.UnSetServer(channelId);
            Assert.True(resultUnset.Success);

            var resultSet2 = await DiscordService.SetServer(serverId, channelId);
            Assert.True(resultSet2.Success);

            // Act.
            // Send dummy message to activate queue.
            await DiscordService.SendToConnectedChannel(serverId, "dummy message");

            // Assert.
            Assert.Equal(2, createCount);
        }

        [Fact]
        public async Task DoesSendAdminTextToMessageQueue()
        {
            // Arrange.
            const string serverId = Constants.AdminChannelID;
            const ulong channelId = 1;
            const string message = "message";

            var messageSent = new TaskCompletionSource<string>();

            var db = DbContextFactory.Create<ApplicationDbContext>();
            db.DiscordServers.Add(new DiscordServers() { ServerId = serverId, DiscordChannelId = channelId });
            await db.SaveChangesAsync();

            var clientMock = MakeMockClientThatExpectGetChannel(channelId);
            Client = clientMock.Object;

            MessageQueueFactory = MakeMessageQueueFactory((s, _) => messageSent.SetResult(s));

            await DiscordService.Init();

            // Act.
            await DiscordService.SendToAdminChannel(message);
            var actualMessage = await messageSent.Task.TimeoutAfter(1000);

            // Assert.
            Assert.Equal(message, actualMessage);
            clientMock.Verify();
        }

        [Fact]
        public async Task DoesSendAdminEmbedToMessageQueue()
        {
            // Arrange.
            const string serverId = Constants.AdminChannelID;
            const ulong channelId = 1;
            Embed message = new EmbedBuilder().Build();

            var messageSent = new TaskCompletionSource<Embed>();

            var db = DbContextFactory.Create<ApplicationDbContext>();
            db.DiscordServers.Add(new DiscordServers() { ServerId = serverId, DiscordChannelId = channelId });
            await db.SaveChangesAsync();

            var clientMock = MakeMockClientThatExpectGetChannel(channelId);
            Client = clientMock.Object;

            MessageQueueFactory = MakeMessageQueueFactory((_, e) => messageSent.SetResult(e));

            await DiscordService.Init();

            // Act.
            await DiscordService.SendToAdminChannel(embed: message);
            var actualMessage = await messageSent.Task.TimeoutAfter(1000);

            // Assert.
            Assert.Equal(message, actualMessage);
            clientMock.Verify();
        }

        [Fact]
        public async Task DoesSendNamedChannelTextToMessageQueue()
        {
            // Arrange.
            const string channelName = "test";
            const ulong channelId = 1;
            const string message = "message";

            var messageSent = new TaskCompletionSource<string>();

            var db = DbContextFactory.Create<ApplicationDbContext>();
            db.NamedDiscordChannels.Add(new NamedDiscordChannel() { DiscordChannelId = channelId, Name = channelName });
            await db.SaveChangesAsync();

            var clientMock = MakeMockClientThatExpectGetChannel(channelId);
            Client = clientMock.Object;

            MessageQueueFactory = MakeMessageQueueFactory((s, _) => messageSent.SetResult(s));

            await DiscordService.Init();

            // Act.
            await DiscordService.SendToNamedChannel(channelName, message);
            var actualMessage = await messageSent.Task.TimeoutAfter(1000);

            // Assert.
            Assert.Equal(message, actualMessage);
            clientMock.Verify();
        }

        [Fact]
        public async Task DoesSendNamedChannelEmbedToMessageQueue()
        {
            // Arrange.
            const string channelName = "test";
            const ulong channelId = 1;
            Embed message = new EmbedBuilder().Build();

            var messageSent = new TaskCompletionSource<Embed>();

            var db = DbContextFactory.Create<ApplicationDbContext>();
            db.NamedDiscordChannels.Add(new NamedDiscordChannel() { DiscordChannelId = channelId, Name = channelName });
            await db.SaveChangesAsync();

            var clientMock = MakeMockClientThatExpectGetChannel(channelId);
            Client = clientMock.Object;

            MessageQueueFactory = MakeMessageQueueFactory((_, e) => messageSent.SetResult(e));

            await DiscordService.Init();

            // Act.
            await DiscordService.SendToNamedChannel(channelName, embed: message);
            var actualMessage = await messageSent.Task.TimeoutAfter(1000);

            // Assert.
            Assert.Equal(message, actualMessage);
            clientMock.Verify();
        }
    }
}
