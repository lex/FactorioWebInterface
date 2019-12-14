using FactorioWebInterface;
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
    public class AddBanFromWeb : IDisposable
    {
        private readonly ServiceProvider serviceProvider;
        private readonly IDbContextFactory dbContextFactory;
        private readonly FactorioBanService factorioBanService;

        public AddBanFromWeb()
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
                new object[]{ new Ban() },
                new object[]{ new Ban {Admin = "admin", DateTime = DateTime.UnixEpoch, Reason = "reason" } },
                new object[]{ new Ban {Username = "player", DateTime = DateTime.UnixEpoch, Reason = "reason" } },
                new object[]{ new Ban {Username = "player", Admin="admin",  DateTime = default, Reason = "reason" } },
                new object[]{ new Ban {Username = "player", Admin = "admin", DateTime = DateTime.UnixEpoch } },
            };

        [Theory]
        [MemberData(nameof(ReturnsFailureOnMissingDataTestCases))]
        public async Task ReturnsFailureOnMissingData(Ban ban)
        {
            // Act.
            var actual = await factorioBanService.AddBanFromWeb(ban, true, "");

            // Assert.
            Assert.False(actual.Success);
        }

        [Fact]
        public async Task BanIsAddedToDatabase()
        {
            // Arrange.
            var ban = new Ban() { Username = "abc", Admin = "admin", Reason = "reason" };

            // Act.
            var result = await factorioBanService.AddBanFromWeb(ban, true, "");

            // Assert.
            var db = dbContextFactory.Create<ApplicationDbContext>();
            var bans = await db.Bans.ToArrayAsync();

            Assert.True(result.Success);
            Assert.Single(bans);
            Assert.Equal(ban, bans[0]);
        }

        [Fact]
        public async Task WhenBanIsAddedEventIsRaised()
        {
            // Arrange.
            var ban = new Ban() { Username = "abc", Admin = "admin", Reason = "reason" };
            var sync = true;

            var eventRaised = new AsyncManualResetEvent();
            FactorioBanEventArgs? eventArgs = null;
            void FactorioBanService_BanChanged(IFactorioBanService sender, FactorioBanEventArgs ev)
            {
                eventArgs = ev;
                eventRaised.Set();
            }

            factorioBanService.BanChanged += FactorioBanService_BanChanged;

            // Act.
            var result = await factorioBanService.AddBanFromWeb(ban, sync, "");
            await eventRaised.WaitAsyncWithTimeout(1000);

            // Assert.
            Assert.NotNull(eventArgs);
            Assert.Equal("", eventArgs!.Source);
            Assert.Equal(sync, eventArgs.SynchronizeWithServers);

            var changeData = eventArgs.ChangeData;

            Assert.Equal(CollectionChangeType.Add, changeData.Type);
            Assert.Single(changeData.NewItems);
            Assert.Equal(ban, changeData.NewItems[0]);
        }
    }
}
