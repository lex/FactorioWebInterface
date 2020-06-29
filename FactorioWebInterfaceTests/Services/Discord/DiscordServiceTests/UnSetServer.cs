using FactorioWebInterface;
using FactorioWebInterface.Data;
using FactorioWebInterfaceTests.Utils;
using Microsoft.EntityFrameworkCore;
using Nito.AsyncEx;
using System.Threading.Tasks;
using Xunit;

namespace FactorioWebInterfaceTests.Services.Discord.DiscordServiceTests
{
    public class UnSetServer : DiscordServiceTestBase
    {
        [Fact]
        public async Task CanRemove()
        {
            // Arrange.
            const string serverId = "serverId";
            const ulong channelId = 1;

            var db = DbContextFactory.Create<ApplicationDbContext>();
            db.DiscordServers.Add(new DiscordServers() { ServerId = serverId, DiscordChannelId = channelId });
            await db.SaveChangesAsync();

            // Act.
            var result = await DiscordService.UnSetServer(channelId);

            // Assert.
            Assert.True(result.Success);
            Assert.Equal(serverId, result.Value);

            var afterDb = DbContextFactory.Create<ApplicationDbContext>();
            var actualServers = await afterDb.DiscordServers.ToArrayAsync();
            Assert.Empty(actualServers);
        }

        [Fact]
        public async Task CanRemove_DisposesActiveQueue()
        {
            // Arrange.
            const string serverId = "serverId";
            const ulong channelId = 1;

            bool disposed = false;
            string? lastMessage = null;

            var db = DbContextFactory.Create<ApplicationDbContext>();
            db.DiscordServers.Add(new DiscordServers() { ServerId = serverId, DiscordChannelId = channelId });
            await db.SaveChangesAsync();

            var clientMock = MakeMockClientThatExpectGetChannel(channelId);
            Client = clientMock.Object;

            MessageQueueFactory = MakeMessageQueueFactory((s, e) => lastMessage = s, () => disposed = true);

            await DiscordService.Init();
            // Send dummy message to activate queue.
            await DiscordService.SendToConnectedChannel(serverId, "dummy message");

            // Act.
            var result = await DiscordService.UnSetServer(channelId);

            // Assert.
            Assert.True(result.Success);
            Assert.Equal(serverId, result.Value);

            var afterDb = DbContextFactory.Create<ApplicationDbContext>();
            var actualServers = await afterDb.DiscordServers.ToArrayAsync();
            Assert.Empty(actualServers);

            Assert.True(disposed);

            await DiscordService.SendToConnectedChannel(serverId, "dummy message2");
            Assert.Equal("dummy message", lastMessage);
        }

        [Fact]
        public async Task CanRemove_DisposesActiveChannelUpdater()
        {
            // Arrange.
            const string serverId = "serverId";
            const ulong channelId = 1;

            bool disposed = false;
            int scheduleUpdateCount = 0;

            var db = DbContextFactory.Create<ApplicationDbContext>();
            db.DiscordServers.Add(new DiscordServers() { ServerId = serverId, DiscordChannelId = channelId });
            await db.SaveChangesAsync();

            var clientMock = MakeMockClientThatExpectGetChannel(channelId);
            Client = clientMock.Object;

            ChannelUpdaterFactory = MakeChannelUpdaterFactory(() => scheduleUpdateCount++, () => disposed = true);

            await DiscordService.Init();
            // Schedule update to activate channel updater.
            await DiscordService.ScheduleUpdateChannelNameAndTopic(serverId);

            // Act.
            var result = await DiscordService.UnSetServer(channelId);

            // Assert.
            Assert.True(result.Success);
            Assert.Equal(serverId, result.Value);

            var afterDb = DbContextFactory.Create<ApplicationDbContext>();
            var actualServers = await afterDb.DiscordServers.ToArrayAsync();
            Assert.Empty(actualServers);

            Assert.True(disposed);

            await DiscordService.ScheduleUpdateChannelNameAndTopic(serverId);
            Assert.Equal(1, scheduleUpdateCount);
        }

        [Fact]
        public async Task CanRemoveAdmin()
        {
            // Arrange.
            const string serverId = Constants.AdminChannelID;
            const ulong channelId = 1;

            var db = DbContextFactory.Create<ApplicationDbContext>();
            db.DiscordServers.Add(new DiscordServers() { ServerId = serverId, DiscordChannelId = channelId });
            await db.SaveChangesAsync();

            // Act.
            var result = await DiscordService.UnSetServer(channelId);

            // Assert.
            Assert.True(result.Success);
            Assert.Equal(serverId, result.Value);

            var afterDb = DbContextFactory.Create<ApplicationDbContext>();
            var actualServers = await afterDb.DiscordServers.ToArrayAsync();
            Assert.Empty(actualServers);
        }

        [Fact]
        public async Task ReturnsError_ForMissingServer()
        {
            // Arrange.            
            const ulong channelId = 1;

            // Act.
            var result = await DiscordService.UnSetServer(channelId);

            // Assert.
            Assert.False(result.Success);
            Assert.Equal("No server was found for the channel.", result.ErrorDescriptions);

            var afterDb = DbContextFactory.Create<ApplicationDbContext>();
            var actualServers = await afterDb.DiscordServers.ToArrayAsync();
            Assert.Empty(actualServers);
        }
    }
}
