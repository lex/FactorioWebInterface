using FactorioWebInterface.Data;
using FactorioWebInterface.Hubs;
using FactorioWebInterface.Services;
using FactorioWebInterfaceTests.Utils;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System;
using System.IO.Abstractions;
using System.IO.Abstractions.TestingHelpers;

namespace FactorioWebInterfaceTests.Services.FactorioAdminServiceTests
{
    public static class FactorioAdminServiceHelper
    {
        public static ServiceProvider MakeFactorioAdminServiceProvider()
        {
            return new ServiceCollection()
                .AddSingleton<IDbContextFactory, TestDbContextFactory>()
                .AddSingleton<IHubContext<FactorioAdminHub, IFactorioAdminClientMethods>, TestFactorioAdminHub>()
                .AddSingleton<IFileSystem, MockFileSystem>()
                .AddSingleton<ILogger<FactorioAdminService>, TestLogger<FactorioAdminService>>()
                .AddSingleton<FactorioAdminService>()
                .BuildServiceProvider();
        }
    }

    public class AdminServiceTestBase : IDisposable
    {
        public ServiceProvider ServiceProvider { get; }
        public IDbContextFactory DbContextFactory { get; }
        public IHubContext<FactorioAdminHub, IFactorioAdminClientMethods> AdminHub { get; }
        public IFileSystem FileSystem { get; }
        public ILogger<FactorioAdminService> Logger { get; }
        public FactorioAdminService AdminService { get; }

        public AdminServiceTestBase()
        {
            ServiceProvider = FactorioAdminServiceHelper.MakeFactorioAdminServiceProvider();
            DbContextFactory = ServiceProvider.GetRequiredService<IDbContextFactory>();
            AdminHub = ServiceProvider.GetRequiredService<IHubContext<FactorioAdminHub, IFactorioAdminClientMethods>>();
            FileSystem = ServiceProvider.GetRequiredService<IFileSystem>();
            Logger = ServiceProvider.GetRequiredService<ILogger<FactorioAdminService>>();
            AdminService = ServiceProvider.GetRequiredService<FactorioAdminService>();
        }

        public void Dispose()
        {
            ServiceProvider.Dispose();
        }
    }
}
