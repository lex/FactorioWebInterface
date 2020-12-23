using FactorioWebInterface;
using FactorioWebInterface.Data;
using FactorioWebInterface.Services;
using Microsoft.EntityFrameworkCore;
using Moq;
using System.Threading.Tasks;
using Xunit;

namespace FactorioWebInterfaceTests.Services.Discord.DiscordServiceTests
{
    public class SetServer : DiscordServiceTestBase
    {
        [Fact]
        public async Task CanSet()
        {
            // Arrange.
            const string serverId = "serverId";
            const ulong channelId = 1;

            var factorioServerDataService = new Mock<IFactorioServerDataService>(MockBehavior.Strict);
            factorioServerDataService.Setup(x => x.IsValidServerId(It.Is<string>(x => x == serverId)))
                .Returns(true)
                .Verifiable("factorioServerDataService should have been called.");

            FactorioServerDataService = factorioServerDataService.Object;

            // Act.
            var result = await DiscordService.SetServer(serverId, channelId);

            // Assert.
            Assert.True(result.Success);

            factorioServerDataService.Verify();

            var db = DbContextFactory.Create<ApplicationDbContext>();
            var actualServers = await db.DiscordServers.ToArrayAsync();
            Assert.Single(actualServers);
            var server = actualServers[0];
            Assert.Equal(serverId, server.ServerId);
            Assert.Equal(channelId, server.DiscordChannelId);
        }

        [Fact]
        public async Task CanSetAdmin()
        {
            // Arrange.
            const ulong channelId = 1;

            // Act.
            var result = await DiscordService.SetAdminChannel(channelId);

            // Assert.
            Assert.True(result.Success);

            var db = DbContextFactory.Create<ApplicationDbContext>();
            var actualServers = await db.DiscordServers.ToArrayAsync();
            Assert.Single(actualServers);
            var server = actualServers[0];
            Assert.Equal(Constants.AdminChannelID, server.ServerId);
            Assert.Equal(channelId, server.DiscordChannelId);
        }

        [Fact]
        public async Task CanSetAdminRemovesOldAdminChannel()
        {
            // Arrange.
            const ulong channelId = 1;

            var db = DbContextFactory.Create<ApplicationDbContext>();
            db.DiscordServers.Add(new DiscordServers() { ServerId = Constants.AdminChannelID, DiscordChannelId = 2 });
            await db.SaveChangesAsync();

            // Act.
            var result = await DiscordService.SetAdminChannel(channelId);

            // Assert.
            Assert.True(result.Success);

            var afterDb = DbContextFactory.Create<ApplicationDbContext>();
            var actualServers = await afterDb.DiscordServers.ToArrayAsync();
            Assert.Single(actualServers);
            var server = actualServers[0];
            Assert.Equal(Constants.AdminChannelID, server.ServerId);
            Assert.Equal(channelId, server.DiscordChannelId);
        }

        [Theory]
        [InlineData("serverId", 1)]
        [InlineData("serverId", 2)]
        [InlineData("otherServerId", 1)]
        public async Task CanSetRemovesOldConnection(string previousServerId, ulong previousChannelId)
        {
            // Arrange.
            const string serverId = "serverId";
            const ulong channelId = 1;

            var db = DbContextFactory.Create<ApplicationDbContext>();
            db.DiscordServers.Add(new DiscordServers() { ServerId = previousServerId, DiscordChannelId = previousChannelId });
            await db.SaveChangesAsync();

            var factorioServerDataService = new Mock<IFactorioServerDataService>(MockBehavior.Strict);
            factorioServerDataService.Setup(x => x.IsValidServerId(It.Is<string>(x => x == serverId)))
                .Returns(true)
                .Verifiable("factorioServerDataService should have been called.");

            FactorioServerDataService = factorioServerDataService.Object;

            // Act.
            var result = await DiscordService.SetServer(serverId, channelId);

            // Assert.
            Assert.True(result.Success);

            factorioServerDataService.Verify();

            var afterDb = DbContextFactory.Create<ApplicationDbContext>();
            var actualServers = await afterDb.DiscordServers.ToArrayAsync();
            Assert.Single(actualServers);
            var server = actualServers[0];
            Assert.Equal(serverId, server.ServerId);
            Assert.Equal(channelId, server.DiscordChannelId);
        }

        [Fact]
        public async Task ReturnsError_ForInvalidServerId()
        {
            // Arrange.
            const string serverId = "serverId";
            const ulong channelId = 1;

            var factorioServerDataService = new Mock<IFactorioServerDataService>(MockBehavior.Strict);
            factorioServerDataService.Setup(x => x.IsValidServerId(It.IsAny<string>()))
                .Returns(false)
                .Verifiable("factorioServerDataService should have been called.");

            FactorioServerDataService = factorioServerDataService.Object;

            // Act.
            var result = await DiscordService.SetServer(serverId, channelId);

            // Assert.
            Assert.False(result.Success);
            Assert.Equal($"The serverID {serverId} was not found.", result.ErrorDescriptions);

            factorioServerDataService.Verify();

            var db = DbContextFactory.Create<ApplicationDbContext>();
            var actualServers = await db.DiscordServers.ToArrayAsync();
            Assert.Empty(actualServers);
        }
    }
}
