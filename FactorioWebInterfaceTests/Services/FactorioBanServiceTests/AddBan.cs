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
    public class AddBan
    {
        private readonly DbContextFactory dbContextFactory;
        private readonly IFactorioBanService factorioBanService;
        public AddBan()
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
            var ban = new Ban() { Username = "abc", Admin = "admin", Reason = "reason" };

            var result = await factorioBanService.AddBan(ban, "", true, "");

            var db = dbContextFactory.Create<ApplicationDbContext>();
            var bans = await db.Bans.ToArrayAsync();

            Assert.True(result);
            Assert.Single(bans);
            Assert.Equal(ban, bans[0]);
        }

        [Fact]
        public async Task WhenBanIsAddedEventIsRaised()
        {
            var ban = new Ban() { Username = "abc", Admin = "admin", Reason = "reason." };
            var serverId = "serverId";
            var sync = true;

            FactorioBanEventArgs eventArgs = null;
            void FactorioBanService_BanChanged(IFactorioBanService sender, FactorioBanEventArgs ev)
            {
                eventArgs = ev;
            }

            factorioBanService.BanChanged += FactorioBanService_BanChanged;
            await factorioBanService.AddBan(ban, serverId, sync, "");
            // event is raise on different thread, so we need to wait for it.
            await Task.Delay(100);

            Assert.NotNull(eventArgs);
            Assert.Equal(serverId, eventArgs.Source);
            Assert.Equal(sync, eventArgs.SynchronizeWithServers);

            var changeData = eventArgs.ChangeData;

            Assert.Equal(CollectionChangeType.Add, changeData.Type);
            Assert.Single(changeData.NewItems);
            Assert.Equal(ban, changeData.NewItems[0]);
        }

        [Fact]
        public async Task WhenBanIsAddedLog()
        {
            var actor = "actor";
            var ban = new Ban() { Username = "abc", Admin = "admin", Reason = "reason." };
            var parma = new object[] { ban.Username, ban.Admin, ban.Reason, actor };
            var expected = $"[BAN] {ban.Username} was banned by {ban.Admin}. Reason: {ban.Reason} Actor: {actor}";

            LogLevel level = default;
            string message = null;

            void Callback(LogLevel l, object state)
            {                
                level = l;
                message = state.ToString();
            }

            var logger = new TestLogger<IFactorioBanService>(Callback);

            var fbs = new FactorioBanService(dbContextFactory, logger);
            await fbs.AddBan(ban, "", true, actor);

            Assert.Equal(LogLevel.Information, level);
            Assert.Equal(expected, message);
        }

        [Fact]
        public async Task DoesNotAddDuplicateBan()
        {
            var ban = new Ban() { Username = "abc", Admin = "admin", Reason = "reason." };

            var db = dbContextFactory.Create<ApplicationDbContext>();
            db.Add(ban);
            await db.SaveChangesAsync();

            await factorioBanService.AddBan(ban, "", true, "");

            db = dbContextFactory.Create<ApplicationDbContext>();
            var bans = await db.Bans.ToArrayAsync();

            Assert.Single(bans);
        }

        [Fact]
        public async Task OldBanIsUpdated()
        {
            var oldBan = new Ban() { Username = "abc", Admin = "admin", Reason = "reason." };
            var newBan = new Ban() { Username = "abc", Admin = "newAdmin", Reason = "new reason." };

            var db = dbContextFactory.Create<ApplicationDbContext>();
            db.Add(oldBan);
            await db.SaveChangesAsync();

            var result = await factorioBanService.AddBan(newBan, "", true, "");

            db = dbContextFactory.Create<ApplicationDbContext>();
            var bans = await db.Bans.ToArrayAsync();

            Assert.True(result);
            Assert.Single(bans);
            Assert.Equal(newBan, bans[0]);
        }
    }
}
