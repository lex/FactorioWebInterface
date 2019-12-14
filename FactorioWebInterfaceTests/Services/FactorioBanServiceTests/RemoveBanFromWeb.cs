using FactorioWebInterface.Data;
using FactorioWebInterface.Models;
using FactorioWebInterface.Services;
using FactorioWebInterfaceTests.Utils;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Nito.AsyncEx;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using Xunit;

namespace FactorioWebInterfaceTests.Services.FactorioBanServiceTests
{
    public class RemoveBanFromWeb : IDisposable
    {
        private readonly ServiceProvider serviceProvider;
        private readonly IDbContextFactory dbContextFactory;
        private readonly FactorioBanService factorioBanService;

        public RemoveBanFromWeb()
        {
            serviceProvider = FactorioBanServiceHelper.MakeFactorioBanServiceProvider();
            dbContextFactory = serviceProvider.GetRequiredService<IDbContextFactory>();
            factorioBanService = serviceProvider.GetRequiredService<FactorioBanService>();
        }

        public void Dispose()
        {
            serviceProvider.Dispose();
        }

        public static IEnumerable<object[]> ReturnsFailureOnMissingDataTestCases =>
            new object[][]
            {
                new object[]{ "", true, "actor" },
                new object[]{ "username", true, "" }
            };

        [Theory]
        [MemberData(nameof(ReturnsFailureOnMissingDataTestCases))]
        public async Task ReturnsFailureOnMissingData(string username, bool synchronizeWithServers, string actor)
        {
            // Act.
            var actual = await factorioBanService.RemoveBanFromWeb(username, synchronizeWithServers, actor);

            // Assert.
            Assert.False(actual.Success);
        }

        [Fact]
        public async Task BanIsRemovedFromDatabase()
        {
            // Arrange.
            var ban = new Ban() { Username = "abc", Admin = "admin", Reason = "reason" };
            var db = dbContextFactory.Create<ApplicationDbContext>();
            db.Add(ban);
            await db.SaveChangesAsync();

            // Act.
            var result = await factorioBanService.RemoveBanFromWeb(ban.Username, true, "actor");

            // Assert.
            var bans = await db.Bans.ToArrayAsync();

            Assert.True(result.Success);
            Assert.Empty(bans);
        }

        [Fact]
        public async Task WhenBanIsRemovedEventIsRaised()
        {
            // Arrange.
            var ban = new Ban() { Username = "abc", Admin = "admin", Reason = "reason" };
            var sync = true;
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
            var result = await factorioBanService.RemoveBanFromWeb(ban.Username, sync, "actor");
            await eventRaised.WaitAsyncWithTimeout(1000);

            // Assert.
            Assert.NotNull(eventArgs);
            Assert.Equal("", eventArgs!.Source);
            Assert.Equal(sync, eventArgs.SynchronizeWithServers);

            var changeData = eventArgs.ChangeData;

            Assert.Equal(CollectionChangeType.Remove, changeData.Type);
            Assert.Single(changeData.OldItems);
            Assert.Equal(ban.Username, changeData.OldItems[0].Username);
        }
    }
}
