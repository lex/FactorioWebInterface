using FactorioWebInterface;
using FactorioWebInterface.Data;
using Microsoft.EntityFrameworkCore;
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

            var db = DbContextFactory.Create<ApplicationDbContext>();
            db.DiscordServers.Add(new DiscordServers() { ServerId = serverId, DiscordChannelId = channelId });
            await db.SaveChangesAsync();

            var clientMock = MakeMockClientThatExpectGetChannel(channelId);
            Client = clientMock.Object;

            MessageQueueFactory = MakeMessageQueueFactory(disposeCallback: () => disposed = true);

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
