using FactorioWebInterface.Data;
using FactorioWebInterface.Models;
using FactorioWebInterface.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Threading.Tasks;
using Xunit;

namespace FactorioWebInterfaceTests.Services.FactorioBanServiceTests
{
    public class DoBanFromGameOutput
    {
        private readonly DbContextFactory dbContextFactory;
        private readonly IFactorioBanService factorioBanService;

        public DoBanFromGameOutput()
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
        public async Task BanIsAddedToDatabase()
        {
            var expected = new Ban() { Username = "abc", Admin = "admin", Reason = "reason." };
            var serverData = new FactorioServerData() { ServerExtraSettings = new FactorioServerExtraSettings() { SyncBans = true } };
            var gameOutput = " abc was banned by admin. Reason: reason.";

            await factorioBanService.DoBanFromGameOutput(serverData, gameOutput);

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
            var serverData = new FactorioServerData() { ServerExtraSettings = new FactorioServerExtraSettings() { SyncBans = true } };
            var gameOutput = " abc admin. Reason: reason.";

            await factorioBanService.DoBanFromGameOutput(serverData, gameOutput);

            var db = dbContextFactory.Create<ApplicationDbContext>();
            var bans = await db.Bans.ToArrayAsync();

            Assert.Empty(bans);
        }

        [Fact]
        public async Task BanIsNotAddedToDatabaseWhenSyncFalse()
        {
            var serverData = new FactorioServerData() { ServerExtraSettings = new FactorioServerExtraSettings() { SyncBans = false } };
            var gameOutput = " abc was banned by admin. Reason: reason.";

            await factorioBanService.DoBanFromGameOutput(serverData, gameOutput);

            var db = dbContextFactory.Create<ApplicationDbContext>();
            var bans = await db.Bans.ToArrayAsync();

            Assert.Empty(bans);
        }

        [Fact]
        public async Task BanIsNotAddedToDatabaseWhenServerAdmin()
        {
            var serverData = new FactorioServerData() { ServerExtraSettings = new FactorioServerExtraSettings() { SyncBans = false } };
            var gameOutput = " abc was banned by <server>. Reason: reason.";

            await factorioBanService.DoBanFromGameOutput(serverData, gameOutput);

            var db = dbContextFactory.Create<ApplicationDbContext>();
            var bans = await db.Bans.ToArrayAsync();

            Assert.Empty(bans);
        }

        [Fact]
        public async Task EventIsNotRaisedWhenServerAdmin()
        {
            var serverData = new FactorioServerData() { ServerExtraSettings = new FactorioServerExtraSettings() { SyncBans = true } };
            var gameOutput = " abc was banned by <server>. Reason: reason.";

            FactorioBanEventArgs eventArgs = null;
            void FactorioBanService_BanChanged(IFactorioBanService sender, FactorioBanEventArgs ev)
            {
                eventArgs = ev;
            }
            factorioBanService.BanChanged += FactorioBanService_BanChanged;

            await factorioBanService.DoBanFromGameOutput(serverData, gameOutput);
            // event is raise on different thread, so we need to wait for it.
            await Task.Delay(100);

            Assert.Null(eventArgs);
        }

        [Fact]
        public async Task WhenBanIsAddedEventIsRaised()
        {
            var ban = new Ban() { Username = "grilledham", Admin = "admin", Reason = "reason." };
            var serverData = new FactorioServerData()
            {
                ServerId = "serverId",
                ServerExtraSettings = new FactorioServerExtraSettings() { SyncBans = true }
            };
            var gameOutput = " grilledham was banned by admin. Reason: reason.";
            var sync = true;

            FactorioBanEventArgs eventArgs = null;
            void FactorioBanService_BanChanged(IFactorioBanService sender, FactorioBanEventArgs ev)
            {
                eventArgs = ev;
            }

            factorioBanService.BanChanged += FactorioBanService_BanChanged;
            await factorioBanService.DoBanFromGameOutput(serverData, gameOutput);
            // event is raise on different thread, so we need to wait for it.
            await Task.Delay(100);

            Assert.NotNull(eventArgs);
            Assert.Equal(serverData.ServerId, eventArgs.Source);
            Assert.Equal(sync, eventArgs.SynchronizeWithServers);

            var changeData = eventArgs.ChangeData;

            Assert.Equal(CollectionChangeType.Add, changeData.Type);
            Assert.Single(changeData.NewItems);
            Assert.Equal(ban.Username, changeData.NewItems[0].Username);
            Assert.Equal(ban.Admin, changeData.NewItems[0].Admin);
            Assert.Equal(ban.Reason, changeData.NewItems[0].Reason);
        }
    }
}
