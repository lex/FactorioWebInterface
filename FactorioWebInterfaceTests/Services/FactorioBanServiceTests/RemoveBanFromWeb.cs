using FactorioWebInterface.Data;
using FactorioWebInterface.Models;
using FactorioWebInterface.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using Xunit;

namespace FactorioWebInterfaceTests.Services.FactorioBanServiceTests
{
    public class RemoveBanFromWeb
    {
        private readonly DbContextFactory dbContextFactory;
        private readonly IFactorioBanService factorioBanService;
        public RemoveBanFromWeb()
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

        public static IEnumerable<object[]> ReturnsFailureOnMissingDataTestCases =>
            new object[][]
            {
                new object[]{ "", true, "actor" },
                new object[]{ "username", true, "" },

            };

        [Theory]
        [MemberData(nameof(ReturnsFailureOnMissingDataTestCases))]
        public async Task ReturnsFailureOnMissingData(string username, bool synchronizeWithServers, string actor)
        {
            var actual = await factorioBanService.RemoveBanFromWeb(username, synchronizeWithServers, actor);

            Assert.False(actual.Success);
        }

        [Fact]
        public async Task BanIsRemovedFromDatabase()
        {
            var ban = new Ban() { Username = "abc", Admin = "admin", Reason = "reason" };
            var db = dbContextFactory.Create<ApplicationDbContext>();
            db.Add(ban);
            await db.SaveChangesAsync();

            var result = await factorioBanService.RemoveBanFromWeb(ban.Username, true, "actor");

            var bans = await db.Bans.ToArrayAsync();

            Assert.True(result.Success);
            Assert.Empty(bans);
        }

        [Fact]
        public async Task WhenBanIsRemovedEventIsRaised()
        {
            var ban = new Ban() { Username = "abc", Admin = "admin", Reason = "reason" };
            var sync = true;
            var db = dbContextFactory.Create<ApplicationDbContext>();
            db.Add(ban);
            await db.SaveChangesAsync();

            FactorioBanEventArgs eventArgs = null;
            void FactorioBanService_BanChanged(IFactorioBanService sender, FactorioBanEventArgs ev)
            {
                eventArgs = ev;
            }

            factorioBanService.BanChanged += FactorioBanService_BanChanged;

            var result = await factorioBanService.RemoveBanFromWeb(ban.Username, sync, "actor");
            // event is raise on different thread, so we need to wait for it.
            await Task.Delay(100);

            Assert.NotNull(eventArgs);
            Assert.Equal("", eventArgs.Source);
            Assert.Equal(sync, eventArgs.SynchronizeWithServers);

            var changeData = eventArgs.ChangeData;

            Assert.Equal(CollectionChangeType.Remove, changeData.Type);
            Assert.Single(changeData.OldItems);
            Assert.Equal(ban.Username, changeData.OldItems[0].Username);
        }
    }
}
