using FactorioWebInterface.Data;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace FactorioWebInterfaceTests.Services.Discord.DiscordServiceTests
{
    public class GetNamedChannels : DiscordServiceTestBase
    {
        [Fact]
        public async Task ReturnsNamedChannelsAfterSet()
        {
            // Arrange.
            await DiscordService.SetNamedChannel("test", 1);
            await DiscordService.SetNamedChannel("test2", 1);
            await DiscordService.SetNamedChannel("otherTest", 2);

            // Act.
            var result = await DiscordService.GetNamedChannels();

            // Assert.
            Assert.True(result.Success);
            var channels = result.Value!.OrderBy(x => x.name).ToArray();
            var expected = new[]
            {
                (name: "otherTest", channel: 2UL),
                (name: "test", channel: 1UL),
                (name: "test2", channel: 1UL)
            };
            Assert.Equal(expected, channels);
        }

        [Fact]
        public async Task ReturnsNamedChannelsAfterInit()
        {
            // Arrange.
            var db = DbContextFactory.Create<ApplicationDbContext>();
            db.NamedDiscordChannels.Add(new NamedDiscordChannel() { Name = "test", DiscordChannelId = 1 });
            db.NamedDiscordChannels.Add(new NamedDiscordChannel() { Name = "test2", DiscordChannelId = 1 });
            db.NamedDiscordChannels.Add(new NamedDiscordChannel() { Name = "otherTest", DiscordChannelId = 2 });
            await db.SaveChangesAsync();

            // Act.
            await DiscordService.Init();

            // Assert.
            var result = await DiscordService.GetNamedChannels();
            Assert.True(result.Success);
            var channels = result.Value!.OrderBy(x => x.name).ToArray();
            var expected = new[]
            {
                (name: "otherTest", channel: 2UL),
                (name: "test", channel: 1UL),
                (name: "test2", channel: 1UL)
            };
            Assert.Equal(expected, channels);
        }

        [Fact]
        public async Task ReturnsEmptyAfterUnSet()
        {
            // Arrange.
            await DiscordService.SetNamedChannel("test", 1);
            await DiscordService.SetNamedChannel("test2", 1);
            await DiscordService.SetNamedChannel("otherTest", 2);

            await DiscordService.UnSetNamedChannel("test");
            await DiscordService.UnSetNamedChannel("test2");
            await DiscordService.UnSetNamedChannel("otherTest");

            // Act.
            var result = await DiscordService.GetNamedChannels();

            // Assert.
            Assert.True(result.Success);
            Assert.Empty(result.Value!);
        }
    }
}
