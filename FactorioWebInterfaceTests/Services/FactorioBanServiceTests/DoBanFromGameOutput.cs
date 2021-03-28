using FactorioWebInterface.Data;
using FactorioWebInterface.Models;
using FactorioWebInterface.Services;
using FactorioWebInterfaceTests.Utils;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Nito.AsyncEx;
using System;
using System.Threading.Tasks;
using Xunit;

namespace FactorioWebInterfaceTests.Services.FactorioBanServiceTests
{
    public class DoBanFromGameOutput : IDisposable
    {
        private readonly ServiceProvider serviceProvider;
        private readonly IDbContextFactory dbContextFactory;
        private readonly FactorioBanService factorioBanService;

        public DoBanFromGameOutput()
        {
            serviceProvider = FactorioBanServiceHelper.MakeFactorioBanServiceProvider();
            dbContextFactory = serviceProvider.GetRequiredService<IDbContextFactory>();
            factorioBanService = serviceProvider.GetRequiredService<FactorioBanService>();
        }

        public void Dispose()
        {
            serviceProvider.Dispose();
        }

        [Theory]
        [InlineData("abc", "abc")]
        [InlineData("DEF", "def")]
        public async Task BanIsAddedToDatabase(string username, string expectedName)
        {
            // Arrange.
            var expected = new Ban() { Username = expectedName, Admin = "admin", Reason = "reason." };
            var serverData = ServerDataHelper.MakeServerData(md => md.ServerExtraSettings = new FactorioServerExtraSettings() { SyncBans = true });
            var gameOutput = $" {username} was banned by admin. Reason: reason.";

            // Act.
            await factorioBanService.DoBanFromGameOutput(serverData, gameOutput);

            // Assert.
            var db = dbContextFactory.Create<ApplicationDbContext>();
            var bans = await db.Bans.ToArrayAsync();

            Assert.Single(bans);
            Assert.Equal(expected.Username, bans[0].Username);
            Assert.Equal(expected.Admin, bans[0].Admin);
            Assert.Equal(expected.Reason, bans[0].Reason);
        }

        [Fact]
        public async Task BanIsNotAddedToDatabaseWhenInvalid()
        {
            // Arrange.
            var serverData = ServerDataHelper.MakeServerData(md => md.ServerExtraSettings = new FactorioServerExtraSettings() { SyncBans = true });
            var gameOutput = " abc admin. Reason: reason.";

            // Act.
            await factorioBanService.DoBanFromGameOutput(serverData, gameOutput);

            // Assert.
            var db = dbContextFactory.Create<ApplicationDbContext>();
            var bans = await db.Bans.ToArrayAsync();

            Assert.Empty(bans);
        }

        [Fact]
        public async Task BanIsNotAddedToDatabaseWhenSyncFalse()
        {
            // Arrange.
            var serverData = ServerDataHelper.MakeServerData(md => md.ServerExtraSettings = new FactorioServerExtraSettings() { SyncBans = false });
            var gameOutput = " abc was banned by admin. Reason: reason.";

            // Act.
            await factorioBanService.DoBanFromGameOutput(serverData, gameOutput);

            // Assert.
            var db = dbContextFactory.Create<ApplicationDbContext>();
            var bans = await db.Bans.ToArrayAsync();

            Assert.Empty(bans);
        }

        [Fact]
        public async Task BanIsNotAddedToDatabaseWhenServerAdmin()
        {
            // Arrange.
            var serverData = ServerDataHelper.MakeServerData(md => md.ServerExtraSettings = new FactorioServerExtraSettings() { SyncBans = false });
            var gameOutput = " abc was banned by <server>. Reason: reason.";

            // Act.
            await factorioBanService.DoBanFromGameOutput(serverData, gameOutput);

            // Assert.
            var db = dbContextFactory.Create<ApplicationDbContext>();
            var bans = await db.Bans.ToArrayAsync();

            Assert.Empty(bans);
        }

        [Fact]
        public async Task EventIsNotRaisedWhenServerAdmin()
        {
            // Arrange.
            var serverData = ServerDataHelper.MakeServerData(md => md.ServerExtraSettings = new FactorioServerExtraSettings() { SyncBans = true });
            var gameOutput = " abc was banned by <server>. Reason: reason.";


            FactorioBanEventArgs? eventArgs = null;
            void FactorioBanService_BanChanged(IFactorioBanService sender, FactorioBanEventArgs ev)
            {
                eventArgs = ev;
            }
            factorioBanService.BanChanged += FactorioBanService_BanChanged;

            // Act.
            await factorioBanService.DoBanFromGameOutput(serverData, gameOutput);
            // event is raise on different thread, so we need to wait for it.
            await Task.Delay(100);

            // Assert.
            Assert.Null(eventArgs);
        }

        [Theory]
        [InlineData("abc", "abc")]
        [InlineData("DEF", "def")]
        public async Task WhenBanIsAddedEventIsRaised(string username, string expectedName)
        {
            // Arrange.
            var ban = new Ban() { Username = username, Admin = "admin", Reason = "reason." };
            var serverData = ServerDataHelper.MakeServerData(md => md.ServerExtraSettings = new FactorioServerExtraSettings() { SyncBans = true });

            var gameOutput = $" {username} was banned by admin. Reason: reason.";
            var sync = true;

            var eventRaised = new AsyncManualResetEvent();
            FactorioBanEventArgs? eventArgs = null;
            void FactorioBanService_BanChanged(IFactorioBanService sender, FactorioBanEventArgs ev)
            {
                eventArgs = ev;
                eventRaised.Set();
            }

            factorioBanService.BanChanged += FactorioBanService_BanChanged;

            // Act.
            await factorioBanService.DoBanFromGameOutput(serverData, gameOutput);
            await eventRaised.WaitAsyncWithTimeout(1000);

            // Assert.
            Assert.NotNull(eventArgs);
            Assert.Equal(serverData.ServerId, eventArgs!.Source);
            Assert.Equal(sync, eventArgs.SynchronizeWithServers);

            var changeData = eventArgs.ChangeData;

            Assert.Equal(CollectionChangeType.Add, changeData.Type);
            Assert.Single(changeData.NewItems);
            Assert.Equal(expectedName, changeData.NewItems[0].Username);
            Assert.Equal(ban.Admin, changeData.NewItems[0].Admin);
            Assert.Equal(ban.Reason, changeData.NewItems[0].Reason);
        }
    }
}
