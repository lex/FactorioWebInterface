using FactorioWebInterface.Data;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace FactorioWebInterfaceTests.Services.Discord.DiscordServiceTests
{
    public class UnSetNamedChannel : DiscordServiceTestBase
    {
        [Fact]
        public async Task CanRemove()
        {
            // Arrange.
            const string channelName = "test";
            const ulong channelId = 1;

            var db = DbContextFactory.Create<ApplicationDbContext>();
            db.NamedDiscordChannels.Add(new NamedDiscordChannel() { DiscordChannelId = channelId, Name = channelName });
            await db.SaveChangesAsync();

            // Act.
            var result = await DiscordService.UnSetNamedChannel(channelName);

            // Assert.
            Assert.True(result.Success);

            var afterDb = DbContextFactory.Create<ApplicationDbContext>();
            var actualChannels = await afterDb.NamedDiscordChannels.ToArrayAsync();
            Assert.Empty(actualChannels);
        }

        [Fact]
        public async Task OnlyRemovesChannelWithName()
        {
            // Arrange.
            const string channelName = "test";
            const ulong channelId = 1;

            const string otherChannelName = "otherName";

            var db = DbContextFactory.Create<ApplicationDbContext>();
            db.NamedDiscordChannels.Add(new NamedDiscordChannel() { DiscordChannelId = channelId, Name = channelName });
            db.NamedDiscordChannels.Add(new NamedDiscordChannel() { DiscordChannelId = channelId, Name = otherChannelName });
            await db.SaveChangesAsync();

            // Act.
            var result = await DiscordService.UnSetNamedChannel(channelName);

            // Assert.
            Assert.True(result.Success);

            var afterDb = DbContextFactory.Create<ApplicationDbContext>();
            var actualChannels = await afterDb.NamedDiscordChannels.ToArrayAsync();
            Assert.Single(actualChannels);
            var server = actualChannels[0];
            Assert.Equal(otherChannelName, server.Name);
            Assert.Equal(channelId, server.DiscordChannelId);
        }

        [Fact]
        public async Task Remove_DisposesActiveQueue()
        {
            // Arrange.
            const string channelName = "test";
            const ulong channelId = 1;

            bool disposed = false;
            string? lastMessage = null;

            var db = DbContextFactory.Create<ApplicationDbContext>();
            db.NamedDiscordChannels.Add(new NamedDiscordChannel() { DiscordChannelId = channelId, Name = channelName });
            await db.SaveChangesAsync();

            var clientMock = MakeMockClientThatExpectGetChannel(channelId);
            Client = clientMock.Object;

            MessageQueueFactory = MakeMessageQueueFactory((s, e) => lastMessage = s, () => disposed = true);

            await DiscordService.Init();
            // Send dummy message to activate queue.
            await DiscordService.SendToNamedChannel(channelName, "dummy message");

            // Act.
            var result = await DiscordService.UnSetNamedChannel(channelName);

            // Assert.
            Assert.True(result.Success);

            var afterDb = DbContextFactory.Create<ApplicationDbContext>();
            var actualChannels = await afterDb.NamedDiscordChannels.ToArrayAsync();
            Assert.Empty(actualChannels);

            Assert.True(disposed);

            await DiscordService.SendToConnectedChannel(channelName, "dummy message2");
            Assert.Equal("dummy message", lastMessage);
        }

        [Fact]
        public async Task ReturnsError_ForMissingName()
        {
            // Arrange.
            const string channelName = "test";

            // Act.
            var result = await DiscordService.UnSetNamedChannel(channelName);

            // Assert.
            Assert.False(result.Success);
            Assert.Equal($"The name {channelName} was not found.", result.ErrorDescriptions);

            var afterDb = DbContextFactory.Create<ApplicationDbContext>();
            var actualChannels = await afterDb.NamedDiscordChannels.ToArrayAsync();
            Assert.Empty(actualChannels);
        }
    }
}
