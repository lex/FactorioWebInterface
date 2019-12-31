using Discord;
using FactorioWebInterface;
using FactorioWebInterface.Data;
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
            await DiscordService.SendToConnectedChannel(serverId, message);
            var actualMessage = await messageSent.Task.TimeoutAfter(1000);

            // Assert.
            Assert.Equal(message, actualMessage);
            clientMock.Verify();
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
            await DiscordService.SendToAdminChannel(message);
            var actualMessage = await messageSent.Task.TimeoutAfter(1000);

            // Assert.
            Assert.Equal(message, actualMessage);
            clientMock.Verify();
        }
    }
}
