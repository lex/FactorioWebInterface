using FactorioWebInterface.Data;
using FactorioWebInterface.Models;
using FactorioWebInterface.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Threading.Tasks;
using Xunit;
using FactorioWebInterfaceTests.Utils;
using Nito.AsyncEx;
using System;

namespace FactorioWebInterfaceTests.Services.FactorioBanServiceTests
{
    public class DoUnBanFromGameOutput : IDisposable
    {
        private readonly ServiceProvider serviceProvider;
        private readonly IDbContextFactory dbContextFactory;
        private readonly FactorioBanService factorioBanService;

        public DoUnBanFromGameOutput()
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
        public async Task BanIsRemovedFromDatabase(string username, string expectedName)
        {
            // Arrange.
            var serverData = ServerDataHelper.MakeServerData(md => md.ServerExtraSettings = new FactorioServerExtraSettings() { SyncBans = true });
            var content = $" {username} was unbanned by admin.";
            var ban = new Ban() { Username = expectedName, Admin = "admin", Reason = "reason." };
            var db = dbContextFactory.Create<ApplicationDbContext>();
            db.Add(ban);
            await db.SaveChangesAsync();

            // Act.
            await factorioBanService.DoUnBanFromGameOutput(serverData, content);

            // Assert.
            var bans = await db.Bans.ToArrayAsync();
            Assert.Empty(bans);
        }

        [Fact]
        public async Task BanIsNotRemovedFromDatabaseWhenSyncFalse()
        {
            // Arrange.
            var serverData = ServerDataHelper.MakeServerData(md => md.ServerExtraSettings = new FactorioServerExtraSettings() { SyncBans = false });
            var content = " abc was unbanned by admin.";
            var ban = new Ban() { Username = "abc", Admin = "admin", Reason = "reason." };
            var db = dbContextFactory.Create<ApplicationDbContext>();
            db.Add(ban);
            await db.SaveChangesAsync();

            // Act.
            await factorioBanService.DoUnBanFromGameOutput(serverData, content);

            // Assert.
            var bans = await db.Bans.ToArrayAsync();
            Assert.Single(bans);
            Assert.Equal(ban, bans[0]);
        }

        [Fact]
        public async Task BanIsNotRemovedFromDatabaseWhenServerAdmin()
        {
            // Arrange.
            var serverData = ServerDataHelper.MakeServerData(md => md.ServerExtraSettings = new FactorioServerExtraSettings() { SyncBans = true });
            var content = " abc was unbanned by <server>.";
            var ban = new Ban() { Username = "abc", Admin = "admin", Reason = "reason." };
            var db = dbContextFactory.Create<ApplicationDbContext>();
            db.Add(ban);
            await db.SaveChangesAsync();

            // Act.
            await factorioBanService.DoUnBanFromGameOutput(serverData, content);

            // Assert.
            var bans = await db.Bans.ToArrayAsync();
            Assert.Single(bans);
            Assert.Equal(ban, bans[0]);
        }

        [Theory]
        [InlineData("abc", "abc")]
        [InlineData("DEF", "def")]
        public async Task WhenBanIsRemovedEventIsRaised(string username, string expectedName)
        {
            // Arrange.
            var serverExtraSettings = new FactorioServerExtraSettings() { SyncBans = true };
            var serverData = ServerDataHelper.MakeServerData(md => md.ServerExtraSettings = serverExtraSettings);
            var content = $" {username} was unbanned by admin.";
            var ban = new Ban() { Username = expectedName, Admin = "admin", Reason = "reason." };
            var db = dbContextFactory.Create<ApplicationDbContext>();
            db.Add(ban);
            await db.SaveChangesAsync();

            var eventRaised = new AsyncManualResetEvent();
            FactorioBanEventArgs? eventArgs = null;
            void FactorioBanService_BanChanged(IFactorioBanService sender, FactorioBanEventArgs ev)
            {
                eventArgs = ev;
                eventRaised.Set();
            }

            factorioBanService.BanChanged += FactorioBanService_BanChanged;

            // Act.
            await factorioBanService.DoUnBanFromGameOutput(serverData, content);
            await eventRaised.WaitAsyncWithTimeout(1000);

            // Assert.
            Assert.NotNull(eventArgs);
            Assert.Equal(serverData.ServerId, eventArgs!.Source);
            Assert.Equal(serverExtraSettings.SyncBans, eventArgs.SynchronizeWithServers);

            var changeData = eventArgs.ChangeData;

            Assert.Equal(CollectionChangeType.Remove, changeData.Type);
            Assert.Single(changeData.OldItems);
            Assert.Equal(ban.Username, changeData.OldItems[0].Username);
        }

        [Fact]
        public async Task EventIsNotRaisedWhenServerAdmin()
        {
            // Arrange.
            var serverData = ServerDataHelper.MakeServerData(md => md.ServerExtraSettings = new FactorioServerExtraSettings() { SyncBans = true });
            var content = " abc was unbanned by <server>.";
            var ban = new Ban() { Username = "abc", Admin = "admin", Reason = "reason." };
            var db = dbContextFactory.Create<ApplicationDbContext>();
            db.Add(ban);
            await db.SaveChangesAsync();

            FactorioBanEventArgs? eventArgs = null;
            void FactorioBanService_BanChanged(IFactorioBanService sender, FactorioBanEventArgs ev)
            {
                eventArgs = ev;
            }

            factorioBanService.BanChanged += FactorioBanService_BanChanged;

            // Act.
            await factorioBanService.DoUnBanFromGameOutput(serverData, content);
            // event is raise on different thread, so we need to wait for it.
            await Task.Delay(100);

            // Assert.
            Assert.Null(eventArgs);
        }
    }
}
