using FactorioWebInterface.Data;
using FactorioWebInterface.Models;
using FactorioWebInterface.Services;
using FactorioWebInterfaceTests.Utils;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Nito.AsyncEx;
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
            // Arrange.
            string serverId = "serverId";
            bool syncBans = true;
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
            await factorioBanService.RemoveBan(ban.Username, serverId, syncBans, "actor");
            await eventRaised.WaitAsyncWithTimeout(1000);

            // Assert.
            Assert.NotNull(eventArgs);
            Assert.Equal(serverId, eventArgs.Source);
            Assert.Equal(syncBans, eventArgs.SynchronizeWithServers);

            var changeData = eventArgs.ChangeData;

            Assert.Equal(CollectionChangeType.Remove, changeData.Type);
            Assert.Single(changeData.OldItems);
            Assert.Equal(ban.Username, changeData.OldItems[0].Username);
        }

        [Fact]
        public async Task WhenBanIsRemovedLog()
        {
            // Arrange.
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

            // Act.
            await fbs.RemoveBan(ban.Username, "", true, actor);

            // Assert.
            Assert.Equal(LogLevel.Information, level);
            Assert.Equal(expected, message);
        }

        [Fact]
        public async Task BanIsRemovedFromDatabase()
        {
            // Arrange.
            string serverId = "serverId";
            bool syncBans = true;
            var ban = new Ban() { Username = "abc", Admin = "admin", Reason = "reason." };
            var db = dbContextFactory.Create<ApplicationDbContext>();
            db.Add(ban);
            await db.SaveChangesAsync();

            // Act.
            await factorioBanService.RemoveBan(ban.Username, serverId, syncBans, "");

            // Assert.
            var bans = await db.Bans.ToArrayAsync();
            Assert.Empty(bans);
        }
    }
}
