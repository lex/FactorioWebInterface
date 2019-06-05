using FactorioWebInterface.Data;
using FactorioWebInterface.Models;
using FactorioWebInterface.Services;
using FactorioWebInterfaceTests.Utils;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using Xunit;

namespace FactorioWebInterfaceTests.Services.FactorioBanServiceTests
{
    public class RemoveBan
    {
        private readonly DbContextFactory dbContextFactory;
        private readonly IFactorioBanService factorioBanService;
        public RemoveBan()
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
        public async Task WhenBanIsRemovedEventIsRaised()
        {
            var serverData = new FactorioServerData()
            {
                ServerExtraSettings = new FactorioServerExtraSettings() { SyncBans = true },
                ServerId = "serverId"
            };
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
            await factorioBanService.RemoveBan(ban.Username, serverData.ServerId, serverData.ServerExtraSettings.SyncBans, "actor");
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
        public async Task WhenBanIsRemovedLog()
        {
            var actor = "actor";
            var ban = new Ban() { Username = "abc", Admin = "admin", Reason = "reason." };
            var parma = new object[] { ban.Username, ban.Admin, ban.Reason, actor };
            var expected = $"[UNBAN] {ban.Username} was unbanned by: {actor}";

            LogLevel level = default;
            string message = null;

            void Callback(LogLevel l, object state)
            {
                level = l;
                message = state.ToString();
            }

            var logger = new TestLogger<IFactorioBanService>(Callback);

            var fbs = new FactorioBanService(dbContextFactory, logger);
            await fbs.RemoveBan(ban.Username, "", true, actor);

            Assert.Equal(LogLevel.Information, level);
            Assert.Equal(expected, message);
        }       

        [Fact]
        public async Task BanIsRemovedFromDatabase()
        {
            var serverData = new FactorioServerData() { ServerExtraSettings = new FactorioServerExtraSettings() { SyncBans = true } };
            var ban = new Ban() { Username = "abc", Admin = "admin", Reason = "reason." };
            var db = dbContextFactory.Create<ApplicationDbContext>();
            db.Add(ban);
            await db.SaveChangesAsync();

            await factorioBanService.RemoveBan(ban.Username, serverData.ServerId, serverData.ServerExtraSettings.SyncBans, "");

            var bans = await db.Bans.ToArrayAsync();
            Assert.Empty(bans);
        }
    }
}
