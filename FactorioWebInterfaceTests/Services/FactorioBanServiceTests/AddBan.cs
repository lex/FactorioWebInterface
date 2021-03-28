using FactorioWebInterface.Data;
using FactorioWebInterface.Models;
using FactorioWebInterface.Services;
using FactorioWebInterfaceTests.Utils;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Nito.AsyncEx;
using System;
using System.Threading.Tasks;
using Xunit;

namespace FactorioWebInterfaceTests.Services.FactorioBanServiceTests
{
    public class AddBan : IDisposable
    {
        private readonly ServiceProvider serviceProvider;
        private readonly IDbContextFactory dbContextFactory;
        private readonly FactorioBanService factorioBanService;

        public AddBan()
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
            var ban = new Ban() { Username = username, Admin = "admin", Reason = "reason" };

            // Act.
            var result = await factorioBanService.AddBan(ban, "", true, "");

            // Assert.
            var db = dbContextFactory.Create<ApplicationDbContext>();
            var bans = await db.Bans.ToArrayAsync();

            Assert.True(result);
            Assert.Single(bans);
            Assert.Equal(expectedName, bans[0].Username);
            Assert.Equal(ban, bans[0]);
        }

        [Theory]
        [InlineData("abc", "abc")]
        [InlineData("DEF", "def")]
        public async Task WhenBanIsAddedEventIsRaised(string username, string expectedName)
        {
            // Arrange.
            var ban = new Ban() { Username = username, Admin = "admin", Reason = "reason." };
            const string serverId = "serverId";
            const bool sync = true;

            var eventRaised = new AsyncManualResetEvent();
            FactorioBanEventArgs? eventArgs = null;
            void FactorioBanService_BanChanged(IFactorioBanService sender, FactorioBanEventArgs ev)
            {
                eventArgs = ev;
                eventRaised.Set();
            }

            factorioBanService.BanChanged += FactorioBanService_BanChanged;

            // Act.
            await factorioBanService.AddBan(ban, serverId, sync, "");
            await eventRaised.WaitAsyncWithTimeout(1000);

            // Assert.
            Assert.NotNull(eventArgs);
            Assert.Equal(serverId, eventArgs!.Source);
            Assert.Equal(sync, eventArgs.SynchronizeWithServers);

            var changeData = eventArgs.ChangeData;

            Assert.Equal(CollectionChangeType.Add, changeData.Type);
            Assert.Single(changeData.NewItems);
            Assert.Equal(expectedName, changeData.NewItems[0].Username);
            Assert.Equal(ban, changeData.NewItems[0]);
        }

        [Theory]
        [InlineData("abc", "abc")]
        [InlineData("DEF", "def")]
        public async Task WhenBanIsAddedLog(string username, string expectedName)
        {
            // Arrange.
            const string actor = "actor";
            var ban = new Ban() { Username = username, Admin = "admin", Reason = "reason." };
            var parma = new object[] { ban.Username, ban.Admin, ban.Reason, actor };
            string expected = $"[BAN] {expectedName} was banned by {ban.Admin}. Reason: {ban.Reason} Actor: {actor}";

            LogLevel level = default;
            string? message = null;

            void Callback(LogLevel l, object state)
            {
                level = l;
                message = state.ToString();
            }

            var logger = new TestLogger<IFactorioBanService>(Callback);
            var fbs = new FactorioBanService(dbContextFactory, logger);

            //Act.
            await fbs.AddBan(ban, "", true, actor);

            // Assert.
            Assert.Equal(LogLevel.Information, level);
            Assert.Equal(expected, message);
        }

        [Fact]
        public async Task DoesNotAddDuplicateBan()
        {
            // Arrange.
            var ban = new Ban() { Username = "abc", Admin = "admin", Reason = "reason." };

            var db = dbContextFactory.Create<ApplicationDbContext>();
            db.Add(ban);
            await db.SaveChangesAsync();

            // Act.
            await factorioBanService.AddBan(ban, "", true, "");

            // Assert.
            db = dbContextFactory.Create<ApplicationDbContext>();
            var bans = await db.Bans.ToArrayAsync();

            Assert.Single(bans);
        }

        [Fact]
        public async Task DoesNotAddDuplicateBanWithDifferentCasing()
        {
            // Arrange.
            var ban = new Ban() { Username = "abc", Admin = "admin", Reason = "reason." };

            var db = dbContextFactory.Create<ApplicationDbContext>();
            db.Add(ban);
            await db.SaveChangesAsync();

            // Act.
            ban.Username = ban.Username.ToUpperInvariant();
            await factorioBanService.AddBan(ban, "", true, "");

            // Assert.
            db = dbContextFactory.Create<ApplicationDbContext>();
            var bans = await db.Bans.ToArrayAsync();

            Assert.Single(bans);
        }

        [Theory]
        [InlineData("abc", "abc")]
        [InlineData("def", "DEF")]
        public async Task OldBanIsUpdated(string firstUsername, string secondUsername)
        {
            // Arrange.
            var oldBan = new Ban() { Username = firstUsername, Admin = "admin", Reason = "reason." };
            var newBan = new Ban() { Username = secondUsername, Admin = "newAdmin", Reason = "new reason." };

            var db = dbContextFactory.Create<ApplicationDbContext>();
            db.Add(oldBan);
            await db.SaveChangesAsync();

            // Act.
            var result = await factorioBanService.AddBan(newBan, "", true, "");

            // Assert.
            db = dbContextFactory.Create<ApplicationDbContext>();
            var bans = await db.Bans.ToArrayAsync();

            Assert.True(result);
            Assert.Single(bans);
            Assert.Equal(newBan, bans[0]);
        }
    }
}
