using FactorioWebInterface.Data;
using FactorioWebInterface.Models;
using FactorioWebInterface.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Threading.Tasks;
using Xunit;
using FactorioWebInterfaceTests.Utils;
using Nito.AsyncEx;

namespace FactorioWebInterfaceTests.Services.FactorioBanServiceTests
{
    public class DoUnBanFromGameOutput
    {
        private readonly DbContextFactory dbContextFactory;
        private readonly IFactorioBanService factorioBanService;
        public DoUnBanFromGameOutput()
        {
            var serviceProvider = new ServiceCollection()
             .AddEntityFrameworkInMemoryDatabase()
             .AddDbContext<ApplicationDbContext>(options =>
             {
                 options.UseInMemoryDatabase("InMemoryDbForTesting");
             })
             .AddSingleton<DbContextFactory, DbContextFactory>()
             .AddSingleton<IFactorioBanService, FactorioBanService>()
             .BuildServiceProvider();

            var db = serviceProvider.GetService<ApplicationDbContext>();
            db.Database.EnsureCreated();

            dbContextFactory = serviceProvider.GetService<DbContextFactory>();
            factorioBanService = serviceProvider.GetService<IFactorioBanService>();
        }

        [Fact]
        public async Task BanIsRemovedFromDatabase()
        {
            // Arrange.
            var serverData = ServerDataHelper.MakeServerData(md => md.ServerExtraSettings = new FactorioServerExtraSettings() { SyncBans = true });
            var content = " abc was unbanned by admin.";
            var ban = new Ban() { Username = "abc", Admin = "admin", Reason = "reason." };
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

        [Fact]
        public async Task WhenBanIsRemovedEventIsRaised()
        {
            // Arrange.
            var serverExtraSettings = new FactorioServerExtraSettings() { SyncBans = true };
            var serverData = ServerDataHelper.MakeServerData(md => md.ServerExtraSettings = serverExtraSettings);
            var content = " abc was unbanned by admin.";
            var ban = new Ban() { Username = "abc", Admin = "admin", Reason = "reason." };
            var db = dbContextFactory.Create<ApplicationDbContext>();
            db.Add(ban);
            await db.SaveChangesAsync();

            var eventRaised = new AsyncManualResetEvent();
            FactorioBanEventArgs eventArgs = null;
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
            Assert.Equal(serverData.ServerId, eventArgs.Source);
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

            FactorioBanEventArgs eventArgs = null;
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
