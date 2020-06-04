using FactorioWebInterface;
using FactorioWebInterface.Data;
using FactorioWebInterface.Services;
using FactorioWebInterfaceTests.Utils;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System;
using System.IO.Abstractions;
using System.IO.Abstractions.TestingHelpers;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace FactorioWebInterfaceTests.Services.DefaultAdminAccountServiceTests
{
    public class SetupDefaultUserAsync : IDisposable
    {
        private readonly ServiceProvider serviceProvider;
        private readonly TestLogger<IDefaultAdminAccountService> logger;
        private readonly MockFileSystem fileSystem;
        private readonly RoleManager<IdentityRole> roleManager;
        private readonly DefaultAdminAccountService defaultAdminAccountService;

        public SetupDefaultUserAsync()
        {
            serviceProvider = DefaultAdminAccountServiceHelper.MakeDefaultAdminAccountServiceProvider();
            logger = (TestLogger<IDefaultAdminAccountService>)serviceProvider.GetRequiredService<ILogger<IDefaultAdminAccountService>>();
            fileSystem = (MockFileSystem)serviceProvider.GetRequiredService<IFileSystem>();
            roleManager = serviceProvider.GetService<RoleManager<IdentityRole>>();
            defaultAdminAccountService = serviceProvider.GetRequiredService<DefaultAdminAccountService>();
        }

        public void Dispose()
        {
            serviceProvider.Dispose();
        }

        [Fact]
        public async Task CreatedSuccessfully()
        {
            // Arrange.
            DefaultAdminAccountServiceHelper.SetupRoles(roleManager);
            DefaultAdminAccountServiceHelper.SetupFileSystem(fileSystem);

            // Act.
            await defaultAdminAccountService.SetupDefaultUserAsync();

            // Assert.
            var db = serviceProvider.GetRequiredService<ApplicationDbContext>();
            var user = db.Users.Single();

            Assert.Equal(Constants.DefaultAdminAccount, user.Id);
            Assert.Equal(Constants.DefaultAdminName, user.UserName);
            Assert.NotEmpty(user.PasswordHash);

            string fileContent = fileSystem.File.ReadAllText(DefaultAdminAccountServiceHelper.filePath);
            Assert.Contains("This account is unsecure. Please setup a personal account", fileContent);
            Assert.Contains($"Username: {Constants.DefaultAdminName}", fileContent);
            Assert.Contains("Password:", fileContent);

            logger.AssertContainsLog(LogLevel.Warning, $"{Constants.DefaultAdminAccount} created. This action potential exposes your interface, creating a new account and restarting this web interface will disable the default admin account");
        }
    }
}
