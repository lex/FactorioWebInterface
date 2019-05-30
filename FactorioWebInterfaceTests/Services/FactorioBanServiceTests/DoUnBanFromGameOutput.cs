using FactorioWebInterface.Data;
using FactorioWebInterface.Models;
using FactorioWebInterface.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Threading.Tasks;
using Xunit;

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
            var serverData = new FactorioServerData() { ServerExtraSettings = new FactorioServerExtraSettings() { SyncBans = true } };
            var content = " abc was unbanned by admin.";
            var ban = new Ban() { Username = "abc", Admin = "admin", Reason = "reason." };
            var db = dbContextFactory.Create<ApplicationDbContext>();
            db.Add(ban);
            await db.SaveChangesAsync();

            await factorioBanService.DoUnBanFromGameOutput(serverData, content);

            var bans = await db.Bans.ToArrayAsync();
            Assert.Empty(bans);
        }

        [Fact]
        public async Task BanIsNotRemovedFromDatabaseWhenSyncFalse()
        {
            var serverData = new FactorioServerData() { ServerExtraSettings = new FactorioServerExtraSettings() { SyncBans = false } };
            var content = " abc was unbanned by admin.";
            var ban = new Ban() { Username = "abc", Admin = "admin", Reason = "reason." };
            var db = dbContextFactory.Create<ApplicationDbContext>();
            db.Add(ban);
            await db.SaveChangesAsync();

            await factorioBanService.DoUnBanFromGameOutput(serverData, content);

            var bans = await db.Bans.ToArrayAsync();
            Assert.Single(bans);
            Assert.Equal(ban, bans[0]);
        }

        [Fact]
        public async Task BanIsNotRemovedFromDatabaseWhenServerAdmin()
        {
            var serverData = new FactorioServerData() { ServerExtraSettings = new FactorioServerExtraSettings() { SyncBans = true } };
            var content = " abc was unbanned by <server>.";
            var ban = new Ban() { Username = "abc", Admin = "admin", Reason = "reason." };
            var db = dbContextFactory.Create<ApplicationDbContext>();
            db.Add(ban);
            await db.SaveChangesAsync();

            await factorioBanService.DoUnBanFromGameOutput(serverData, content);

            var bans = await db.Bans.ToArrayAsync();
            Assert.Single(bans);
            Assert.Equal(ban, bans[0]);
        }

        [Fact]
        public async Task WhenBanIsRemovedEventIsRaised()
        {
            var serverData = new FactorioServerData()
            {
                ServerExtraSettings = new FactorioServerExtraSettings() { SyncBans = true },
                ServerId = "serverId"
            };
            var content = " abc was unbanned by admin.";
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
            await factorioBanService.DoUnBanFromGameOutput(serverData, content);
            // event is raise on different thread, so we need to wait for it.
            await Task.Delay(100);

            Assert.NotNull(eventArgs);
            Assert.Equal(serverData.ServerId, eventArgs.Source);
            Assert.Equal(serverData.ServerExtraSettings.SyncBans, eventArgs.SynchronizeWithServers);

            var changeData = eventArgs.ChangeData;

            Assert.Equal(CollectionChangeType.Remove, changeData.Type);
            Assert.Single(changeData.OldItems);
            Assert.Equal(ban.Username, changeData.OldItems[0].Username);
        }

        [Fact]
        public async Task EventIsNotRaisedWhenServerAdmin()
        {
            var serverData = new FactorioServerData() { ServerExtraSettings = new FactorioServerExtraSettings() { SyncBans = true } };
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
            await factorioBanService.DoUnBanFromGameOutput(serverData, content);
            // event is raise on different thread, so we need to wait for it.
            await Task.Delay(100);

            Assert.Null(eventArgs);
        }
    }
}
