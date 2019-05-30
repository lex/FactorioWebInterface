using Xunit;
using FactorioWebInterface.Data;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using FactorioWebInterface.Services;
using System.Threading.Tasks;
using System;

namespace FactorioWebInterfaceTests.Services.FactorioBanServiceTests
{
    public class GetBans
    {
        private readonly IServiceProvider serviceProvider;
        private readonly IFactorioBanService factorioBanService;
        public GetBans()
        {
            serviceProvider = new ServiceCollection()
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

            factorioBanService = serviceProvider.GetService<IFactorioBanService>();
        }

        [Fact]
        public async Task GetBansAsync()
        {
            var bans = new Ban[]
            {
                 new Ban() { Username = "abc", Admin = "admin", Reason = "reason" },
                 new Ban() { Username = "def", Admin = "admin", Reason = "reason" },
                 new Ban() { Username = "ghi", Admin = "admin", Reason = "reason" },
            };

            var db = serviceProvider.GetService<ApplicationDbContext>();
            db.Bans.AddRange(bans);
            await db.SaveChangesAsync();

            var actual = await factorioBanService.GetBansAsync();

            Assert.Equal(bans, actual);
        }

        [Fact]
        public async Task GetBansAsync_NoBans()
        {
            var actual = await factorioBanService.GetBansAsync();

            Assert.Empty(actual);
        }

        [Fact]
        public async Task GetBanUserNamesAsync()
        {
            var bans = new Ban[]
            {
                 new Ban() { Username = "ghi", Admin = "admin", Reason = "reason" },
                 new Ban() { Username = "def", Admin = "admin", Reason = "reason" },
                 new Ban() { Username = "abc", Admin = "admin", Reason = "reason" },
            };

            var db = serviceProvider.GetService<ApplicationDbContext>();
            db.Bans.AddRange(bans);
            await db.SaveChangesAsync();

            var actual = await factorioBanService.GetBanUserNamesAsync();

            Assert.Equal(bans[0].Username, actual[2]);
            Assert.Equal(bans[1].Username, actual[1]);
            Assert.Equal(bans[2].Username, actual[0]);
        }

        [Fact]
        public async Task GetBanUserNamesAsync_NoBans()
        {
            var actual = await factorioBanService.GetBanUserNamesAsync();

            Assert.Empty(actual);
        }
    }
}
