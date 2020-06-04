using FactorioWebInterface;
using FactorioWebInterface.Data;
using FactorioWebInterface.Services;
using FactorioWebInterfaceTests.Utils;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
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
        }

        public void Dispose()
        {
            serviceProvider.Dispose();
        }

        [Fact]
        public async Task CreatedSuccessfully()
        {
            // Arrange.
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

        [Fact]
        public async Task DefaultIsOnlyRootAccountTest()
        {
            // Arrange.
            await CreatedSuccessfully();

            // Act.
            var result = await defaultAdminAccountService.OnlyAccount();

            // Assert.
            Assert.Equal(DefaultAdminAccountService.AccountsNumbers.DefaultIsOnlyRootAccount, result);
        }

        [Fact]
        public async Task MultipleAccountsTest()
        {
            // Arrange.
            await CreatedSuccessfully();
            var user = new ApplicationUser()
            {
                Id = "testUser",
                UserName = "Test User"
            };
            await userManager.CreateAsync(user, "testing1234");
            await userManager.AddToRoleAsync(user, Constants.RootRole);

            // Act.
            var result = await defaultAdminAccountService.OnlyAccount();

            // Assert.
            Assert.Equal(DefaultAdminAccountService.AccountsNumbers.MultipleAccounts, result);
        }

        [Fact]
        public async Task MultipleAccountsNoDefaultUserTest()
        {
            // Arrange.
            var user = new ApplicationUser()
            {
                Id = "testRootUser",
                UserName = "Test Root User"
            };
            await userManager.CreateAsync(user, "testing1234");
            await userManager.AddToRoleAsync(user, Constants.RootRole);

            user = new ApplicationUser()
            {
                Id = "testAdminUser",
                UserName = "Test Admin User"
            };
            await userManager.CreateAsync(user, "testing1234");
            await userManager.AddToRoleAsync(user, Constants.AdminRole);

            // Act.
            var result = await defaultAdminAccountService.OnlyAccount();

            // Assert.
            Assert.Equal(DefaultAdminAccountService.AccountsNumbers.MultipleAccounts, result);
        }

        [Fact]
        public async Task NoAccountsTest()
        {
            // Arrange.

            // Act.
            var result = await defaultAdminAccountService.OnlyAccount();

            // Assert.
            Assert.Equal(DefaultAdminAccountService.AccountsNumbers.NoAccounts, result);
        }

        [Fact]
        public async Task NoRootAccountTest()
        {
            // Arrange.
            var user = new ApplicationUser()
            {
                Id = "testUser",
                UserName = "Test User"
            };
            await userManager.CreateAsync(user, "testing1234");

            // Act.
            var result = await defaultAdminAccountService.OnlyAccount();

            // Assert.
            Assert.Equal(DefaultAdminAccountService.AccountsNumbers.NoRootAccount, result);
        }

        private async Task ValidateDefaultUser(ApplicationUser user, bool expected)
        {
            // Arrange.

            // Act.
            var result = await defaultAdminAccountService.ValidateDefaultUserAsync(user);

            // Assert.
            Assert.Equal(expected, result);
        }

        [Fact]
        public async Task ValidateDefaultUserTest()
        {
            // Arrange.
            await CreatedSuccessfully();
            var validDefaultUser = await userManager.FindByIdAsync(Constants.DefaultAdminAccount);

            var invalidDefaultUser = new ApplicationUser()
            {
                Id = "DefaultTestUser",
                UserName = "Default Test User"
            };
            await userManager.CreateAsync(invalidDefaultUser, Guid.NewGuid().ToString());
            await userManager.AddToRolesAsync(invalidDefaultUser, new string[] { Constants.AdminRole, Constants.RootRole });

            var invalidPassword = new ApplicationUser()
            {
                Id = "DefaultTestUserPassword",
                UserName = Constants.DefaultAdminName
            };
            await userManager.CreateAsync(invalidPassword);
            await userManager.AddToRolesAsync(invalidPassword, new string[] { Constants.AdminRole, Constants.RootRole });

            var invalidRole = new ApplicationUser()
            {
                Id = "DefaultTestUserRole",
                UserName = Constants.DefaultAdminName
            };
            await userManager.CreateAsync(invalidRole, Guid.NewGuid().ToString());
            await userManager.AddToRoleAsync(invalidRole, Constants.AdminRole);

            // Act.
            await ValidateDefaultUser(validDefaultUser, true);
            await ValidateDefaultUser(invalidDefaultUser, false);
            await ValidateDefaultUser(invalidPassword, false);
            await ValidateDefaultUser(invalidRole, false);
        }

        [Fact]
        public async Task DeleteDefaultAccountFileTest()
        {
            // Arrange.
            await CreatedSuccessfully();

            // Act.
            defaultAdminAccountService.DeleteDefaultAccountFile();

            // Assert.
            Assert.False(fileSystem.File.Exists(DefaultAdminAccountServiceHelper.filePath));
        }
    }
}
