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
        private readonly UserManager<ApplicationUser> userManager;
        private readonly DefaultAdminAccountService defaultAdminAccountService;

        public SetupDefaultUserAsync()
        {
            serviceProvider = DefaultAdminAccountServiceHelper.MakeDefaultAdminAccountServiceProvider();
            logger = (TestLogger<IDefaultAdminAccountService>)serviceProvider.GetRequiredService<ILogger<IDefaultAdminAccountService>>();
            fileSystem = (MockFileSystem)serviceProvider.GetRequiredService<IFileSystem>();
            roleManager = serviceProvider.GetService<RoleManager<IdentityRole>>();
            userManager = serviceProvider.GetService<UserManager<ApplicationUser>>();
            defaultAdminAccountService = serviceProvider.GetRequiredService<DefaultAdminAccountService>();
            DefaultAdminAccountServiceHelper.SetupRoles(roleManager);
            DefaultAdminAccountServiceHelper.SetupFileSystem(fileSystem);
        }

        public void Dispose()
        {
            serviceProvider.Dispose();
        }

        [Fact]
        public async Task CreatedSuccessfully_WhenNoUsers()
        {
            // Act.
            await defaultAdminAccountService.SetupDefaultUserAsync();

            // Assert.
            var db = serviceProvider.GetRequiredService<ApplicationDbContext>();
            var user = db.Users.Single();

            Assert.Equal(Constants.DefaultAdminAccount, user.Id);
            Assert.Equal(Constants.DefaultAdminName, user.UserName);
            Assert.NotEmpty(user.PasswordHash);

            string fileContent = fileSystem.File.ReadAllText(DefaultAdminAccountServiceHelper.filePath);
            Assert.Contains($"It is recommended to change the {Constants.DefaultAdminName} password on the user's account page and to delete this file.", fileContent);
            Assert.Contains($"Username: {Constants.DefaultAdminName}", fileContent);
            Assert.Contains("Password:", fileContent);

            logger.AssertContainsLog(LogLevel.Warning, $"{Constants.DefaultAdminAccount} created, see {Constants.DefaultAdminFile} for password. It is recommended to change the {Constants.DefaultAdminAccount} password on the user's account page");
        }

        [Fact]
        public async Task NotCreated_WhenUsers()
        {
            // Arrange.            
            await userManager.CreateAsync(new ApplicationUser() { Id = "Test", UserName = "Test" });

            // Act.
            await defaultAdminAccountService.SetupDefaultUserAsync();

            // Assert.
            var db = serviceProvider.GetRequiredService<ApplicationDbContext>();
            var user = db.Users.Single();

            Assert.Equal("Test", user.Id);
            Assert.Equal("Test", user.UserName);
            Assert.False(fileSystem.File.Exists(DefaultAdminAccountServiceHelper.filePath));
        }
    }
}
