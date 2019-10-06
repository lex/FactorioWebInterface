using FactorioWebInterface.Data;
using FactorioWebInterface.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace FactorioWebInterfaceTests.Services.FactorioBanServiceTests
{
    public static class FactorioBanServiceHelper
    {
        public static ServiceProvider MakeFactorioBanServiceProvider()
        {
            ServiceProvider serviceProvider = new ServiceCollection()
                .AddEntityFrameworkInMemoryDatabase()
                .AddDbContext<ApplicationDbContext>(options =>
                {
                    options.UseInMemoryDatabase("InMemoryDbForTesting");
                })
                .AddSingleton<IDbContextFactory, DbContextFactory>()
                .AddSingleton<FactorioBanService>()
                .BuildServiceProvider();

            var db = serviceProvider.GetService<ApplicationDbContext>();
            db.Database.EnsureCreated();

            return serviceProvider;
        }
    }
}
