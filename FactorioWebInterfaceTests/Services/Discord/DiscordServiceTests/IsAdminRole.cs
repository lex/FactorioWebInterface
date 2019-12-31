using Discord;
using FactorioWebInterface.Services.Discord;
using Moq;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace FactorioWebInterfaceTests.Services.Discord.DiscordServiceTests
{
    public class IsAdminRole : DiscordServiceTestBase
    {
        const ulong GuildId = 1;

        [Fact]
        public async Task ReturnsTrueForUserWithRole()
        {
            // Arrange.
            ulong userId = 1;
            var roleIds = new ulong[] { 2 };
            SetupClient(userId, userRoleIds: roleIds, adminRoleIds: roleIds);

            // Act + Assert.
            Assert.True(await DiscordService.IsAdminRoleAsync(userId));
            Assert.True(await DiscordService.IsAdminRoleAsync(userId.ToString()));
        }

        [Fact]
        public async Task ReturnsFalseForUserWithoutRole()
        {
            // Arrange.
            ulong userId = 1;
            var roleIds = new ulong[] { 2 };
            var adminRoleIds = new ulong[] { 3 };
            SetupClient(userId, userRoleIds: roleIds, adminRoleIds: adminRoleIds);

            // Act + Assert.
            Assert.False(await DiscordService.IsAdminRoleAsync(userId));
            Assert.False(await DiscordService.IsAdminRoleAsync(userId.ToString()));
        }

        [Fact]
        public async Task ReturnsFalseForUnknownUser()
        {
            // Arrange.
            ulong userId = 1;
            var roleIds = new ulong[] { 2 };
            SetupClient(userId, userRoleIds: roleIds, adminRoleIds: roleIds);

            // Act + Assert.
            Assert.False(await DiscordService.IsAdminRoleAsync(0));
            Assert.False(await DiscordService.IsAdminRoleAsync(0.ToString()));
        }

        private void SetupClient(ulong userId, ulong[] userRoleIds, ulong[] adminRoleIds)
        {
            Configuration = new DiscordServiceConfiguration(GuildId, adminRoleIds.ToHashSet());

            var userMock = new Mock<IGuildUser>(MockBehavior.Strict);
            userMock.SetupGet(x => x.RoleIds).Returns(userRoleIds);

            var guildMock = new Mock<IGuild>(MockBehavior.Strict);
            guildMock.Setup(x => x.GetUserAsync(userId, It.IsAny<CacheMode>(), It.IsAny<RequestOptions>())).Returns(Task.FromResult(userMock.Object));
            guildMock.Setup(x => x.GetUserAsync(It.Is<ulong>(x => x != userId), It.IsAny<CacheMode>(), It.IsAny<RequestOptions>())).Returns(Task.FromResult((IGuildUser?)null));

            var clientMock = new Mock<IDiscordClientWrapper>(MockBehavior.Strict);
            clientMock.Setup(x => x.GetGuild(It.IsAny<ulong>())).Returns(guildMock.Object);

            Client = clientMock.Object;
        }
    }
}
