using FactorioWebInterface;
using FactorioWebInterface.Data;
using FactorioWebInterface.Services;
using FactorioWebInterfaceTests.Utils;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.IO.Abstractions;
using System.IO.Abstractions.TestingHelpers;

namespace FactorioWebInterfaceTests.Services.DefaultAdminAccountServiceTests
{
    public static class DefaultAdminAccountServiceHelper
    {
        public static readonly string directoryPath = AppDomain.CurrentDomain.BaseDirectory!;
        public static readonly string filePath = Path.Combine(directoryPath, Constants.DefaultAdminFile);

        public static ServiceProvider MakeDefaultAdminAccountServiceProvider()
        {
            var dbContextFactory = new TestDbContextFactory();

            var serviceCollection = new ServiceCollection();

            serviceCollection
                .AddSingleton(typeof(ILogger<>), typeof(TestLogger<>))
                .AddSingleton<IFileSystem, MockFileSystem>()
                .AddTransient<ApplicationDbContext>(_ => dbContextFactory.Create<ApplicationDbContext>())
                .AddTransient<DefaultAdminAccountService>()
                .AddTransient<UserManager<ApplicationUser>>();
            Startup.SetupIdentity(serviceCollection);

            return serviceCollection.BuildServiceProvider();
        }

        public static void SetupRoles(RoleManager<IdentityRole> roleManager)
        {
            roleManager.CreateAsync(new IdentityRole(Constants.RootRole));
            roleManager.CreateAsync(new IdentityRole(Constants.AdminRole));
        }

        public static void SetupFileSystem(MockFileSystem fileSystem)
        {
            fileSystem.Directory.CreateDirectory(directoryPath);
        }
    }
}
