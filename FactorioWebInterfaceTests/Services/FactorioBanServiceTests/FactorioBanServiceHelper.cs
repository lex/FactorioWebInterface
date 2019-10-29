using FactorioWebInterface.Data;
using FactorioWebInterface.Services;
using FactorioWebInterfaceTests.Utils;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FactorioWebInterfaceTests.Services.FactorioBanServiceTests
{
    public static class FactorioBanServiceHelper
    {
        public static ServiceProvider MakeFactorioBanServiceProvider()
        {
            return new ServiceCollection()
                .AddSingleton<IDbContextFactory, TestDbContextFactory>()
                .AddSingleton<FactorioBanService>()
                .AddSingleton<ILogger<IFactorioBanService>, TestLogger<IFactorioBanService>>()
                .BuildServiceProvider();
        }
    }
}
