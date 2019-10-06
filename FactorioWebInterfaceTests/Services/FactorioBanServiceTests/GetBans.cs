using Xunit;
using FactorioWebInterface.Data;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using FactorioWebInterface.Services;
using System.Threading.Tasks;
using System;

namespace FactorioWebInterfaceTests.Services.FactorioBanServiceTests
{
    public class GetBans : IDisposable
    {
        private readonly ServiceProvider serviceProvider;
        private readonly IDbContextFactory dbContextFactory;
        private readonly FactorioBanService factorioBanService;

        public GetBans()
        {
            serviceProvider = FactorioBanServiceHelper.MakeFactorioBanServiceProvider();
            dbContextFactory = serviceProvider.GetRequiredService<IDbContextFactory>();
            factorioBanService = serviceProvider.GetRequiredService<FactorioBanService>();
        }

        public void Dispose()
        {
            serviceProvider.Dispose();
        }

        [Fact]
        public async Task GetBansAsync()
        {
            // Arrange.
            var bans = new Ban[]
            {
                 new Ban() { Username = "abc", Admin = "admin", Reason = "reason" },
                 new Ban() { Username = "def", Admin = "admin", Reason = "reason" },
                 new Ban() { Username = "ghi", Admin = "admin", Reason = "reason" },
            };

            var db = serviceProvider.GetService<ApplicationDbContext>();
            db.Bans.AddRange(bans);
            await db.SaveChangesAsync();

            // Act.
            var actual = await factorioBanService.GetBansAsync();

            // Assert.
            Assert.Equal(bans, actual);
        }

        [Fact]
        public async Task GetBansAsync_NoBans()
        {
            // Act.
            var actual = await factorioBanService.GetBansAsync();

            // Assert.
            Assert.Empty(actual);
        }

        [Fact]
        public async Task GetBanUserNamesAsync()
        {
            // Arrange.
            var bans = new Ban[]
            {
                 new Ban() { Username = "ghi", Admin = "admin", Reason = "reason" },
                 new Ban() { Username = "def", Admin = "admin", Reason = "reason" },
                 new Ban() { Username = "abc", Admin = "admin", Reason = "reason" },
            };

            var db = serviceProvider.GetService<ApplicationDbContext>();
            db.Bans.AddRange(bans);
            await db.SaveChangesAsync();

            // Act.
            var actual = await factorioBanService.GetBanUserNamesAsync();

            // Assert.
            Assert.Equal(bans[0].Username, actual[2]);
            Assert.Equal(bans[1].Username, actual[1]);
            Assert.Equal(bans[2].Username, actual[0]);
        }

        [Fact]
        public async Task GetBanUserNamesAsync_NoBans()
        {
            // Act.
            var actual = await factorioBanService.GetBanUserNamesAsync();

            // Assert.
            Assert.Empty(actual);
        }
    }
}
