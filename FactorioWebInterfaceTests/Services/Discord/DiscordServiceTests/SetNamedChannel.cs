using FactorioWebInterface.Data;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace FactorioWebInterfaceTests.Services.Discord.DiscordServiceTests
{
    public class SetNamedChannel : DiscordServiceTestBase
    {
        [Fact]
        public async Task CanSet()
        {
            // Arrange.
            const string channelName = "test";
            const ulong channelId = 1;

            // Act.
            var result = await DiscordService.SetNamedChannel(channelName, channelId);

            // Assert.
            Assert.True(result.Success);

            var db = DbContextFactory.Create<ApplicationDbContext>();
            var actualChannels = await db.NamedDiscordChannels.AsQueryable().ToArrayAsync();
            Assert.Single(actualChannels);
            var server = actualChannels[0];
            Assert.Equal(channelName, server.Name);
            Assert.Equal(channelId, server.DiscordChannelId);
        }

        [Fact]
        public async Task CanSetMultipleNamesForSameChannel()
        {
            // Arrange.
            const string channelName = "test";
            const string channelName2 = "test2";
            const string channelName3 = "test3";
            const ulong channelId = 1;

            // Act.
            var result = await DiscordService.SetNamedChannel(channelName, channelId);
            var result2 = await DiscordService.SetNamedChannel(channelName2, channelId);
            var result3 = await DiscordService.SetNamedChannel(channelName3, channelId);

            // Assert.
            Assert.True(result.Success);
            Assert.True(result2.Success);
            Assert.True(result3.Success);

            var db = DbContextFactory.Create<ApplicationDbContext>();
            var actualChannels = await db.NamedDiscordChannels.AsQueryable().OrderBy(c => c.Name).ToArrayAsync();
            Assert.Equal(3, actualChannels.Length);

            var server = actualChannels[0];
            Assert.Equal(channelName, server.Name);
            Assert.Equal(channelId, server.DiscordChannelId);

            var server2 = actualChannels[1];
            Assert.Equal(channelName2, server2.Name);
            Assert.Equal(channelId, server2.DiscordChannelId);

            var server3 = actualChannels[2];
            Assert.Equal(channelName3, server3.Name);
            Assert.Equal(channelId, server3.DiscordChannelId);
        }

        [Fact]
        public async Task SetRemovesOldConnection()
        {
            // Arrange.
            const string channelName = "test";
            const ulong previousChannelId = 1;
            const ulong channelId = 2;

            var db = DbContextFactory.Create<ApplicationDbContext>();
            db.NamedDiscordChannels.Add(new NamedDiscordChannel() { DiscordChannelId = previousChannelId, Name = channelName });
            await db.SaveChangesAsync();

            // Act.
            var result = await DiscordService.SetNamedChannel(channelName, channelId);

            // Assert.
            Assert.True(result.Success);

            var afterDb = DbContextFactory.Create<ApplicationDbContext>();
            var actualChannels = await afterDb.NamedDiscordChannels.AsQueryable().ToArrayAsync();
            Assert.Single(actualChannels);
            var server = actualChannels[0];
            Assert.Equal(channelName, server.Name);
            Assert.Equal(channelId, server.DiscordChannelId);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData(" ")]
        [InlineData("map promotion")]
        public async Task ReturnsError_ForInvalidChannelName(string channelName)
        {
            // Arrange.            
            const ulong channelId = 1;

            // Act.
            var result = await DiscordService.SetNamedChannel(channelName, channelId);

            // Assert.
            Assert.False(result.Success);
            Assert.Equal("Channel name can not be empty or whitespace or contain space ' ' characters.", result.ErrorDescriptions);

            var db = DbContextFactory.Create<ApplicationDbContext>();
            var actualChannels = await db.NamedDiscordChannels.AsQueryable().ToArrayAsync();
            Assert.Empty(actualChannels);
        }
    }
}
