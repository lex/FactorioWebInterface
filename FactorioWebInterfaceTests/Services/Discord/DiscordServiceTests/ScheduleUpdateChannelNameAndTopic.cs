using FactorioWebInterface.Data;
using System.Threading.Tasks;
using Xunit;
using FactorioWebInterface.Services.Discord;
using FactorioWebInterface.Utils;
using FactorioWebInterface.Services;
using Moq;
using Discord;

namespace FactorioWebInterfaceTests.Services.Discord.DiscordServiceTests
{
    public class ScheduleUpdateChannelNameAndTopic : DiscordServiceTestBase
    {
        [Fact]
        public async Task DoesScheduleUpdateWithChannelUpdater()
        {
            // Arrange.
            const string serverId = "serverId";
            const ulong channelId = 1;

            var updateScheduled = new TaskCompletionSource<Unit>();

            var db = DbContextFactory.Create<ApplicationDbContext>();
            db.DiscordServers.Add(new DiscordServers() { ServerId = serverId, DiscordChannelId = channelId });
            await db.SaveChangesAsync();

            var clientMock = MakeMockClientThatExpectGetChannel(channelId);
            Client = clientMock.Object;

            ChannelUpdaterFactory = MakeChannelUpdaterFactory(() => updateScheduled.SetResult(default));

            await DiscordService.Init();

            // Act.
            await DiscordService.ScheduleUpdateChannelNameAndTopic(serverId);
            var actualMessage = await updateScheduled.Task.TimeoutAfter(1000);

            // Assert.            
            clientMock.Verify();
        }

        [Fact]
        public async Task AfterRemoveAndSet_CreatesChannelUpdater()
        {
            // Arrange.
            const string serverId = "serverId";
            const ulong channelId = 1;

            var factorioServerDataService = new Mock<IFactorioServerDataService>(MockBehavior.Strict);
            factorioServerDataService.Setup(x => x.IsValidServerId(It.Is<string>(x => x == serverId))).Returns(true);
            FactorioServerDataService = factorioServerDataService.Object;

            var clientMock = MakeMockClientThatExpectGetChannel(channelId);
            Client = clientMock.Object;

            var channelMock = new Mock<IChannelUpdater>(MockBehavior.Loose);

            int createCount = 0;
            var factoryMock = new Mock<IChannelUpdaterFactory>(MockBehavior.Strict);
            factoryMock.Setup(x => x.Create(It.IsAny<ITextChannel>(), It.IsAny<string>()))
                .Returns(channelMock.Object)
                .Callback((ITextChannel _, string __) => createCount++);
            ChannelUpdaterFactory = factoryMock.Object;

            await DiscordService.Init();

            var resultSet = await DiscordService.SetServer(serverId, channelId);
            Assert.True(resultSet.Success);

            // Schedule update to activate channel updater.
            await DiscordService.ScheduleUpdateChannelNameAndTopic(serverId);
            Assert.Equal(1, createCount);

            var resultUnset = await DiscordService.UnSetServer(channelId);
            Assert.True(resultUnset.Success);

            var resultSet2 = await DiscordService.SetServer(serverId, channelId);
            Assert.True(resultSet2.Success);

            // Act.
            // Schedule update to activate channel updater.
            await DiscordService.ScheduleUpdateChannelNameAndTopic(serverId);

            // Assert.
            Assert.Equal(2, createCount);
        }
    }
}
