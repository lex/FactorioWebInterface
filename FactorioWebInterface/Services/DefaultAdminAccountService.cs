using FactorioWebInterface.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.IO.Abstractions;
using System.Linq;
using System.Threading.Tasks;

namespace FactorioWebInterface.Services
{
    public interface IDefaultAdminAccountService
    {
        Task SetupDefaultUserAsync();
    }

    public class DefaultAdminAccountService : IDefaultAdminAccountService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<IDefaultAdminAccountService> _logger;
        private readonly IFileSystem _fileSystem;

        public DefaultAdminAccountService(UserManager<ApplicationUser> userManager, ILogger<IDefaultAdminAccountService> logger, IFileSystem fileSystem)
        {
            _userManager = userManager;
            _logger = logger;
            _fileSystem = fileSystem;
        }

        public enum AccountsNumbers
        {
            NoAccounts,
            NoRootAccount,
            DefaultIsOnlyRootAccount,
            MultipleAccounts
        }

        public async Task SetupDefaultUserAsync()
        {
            string id = Constants.DefaultAdminAccount;

            await ValidateOrClearDefaultUserAsync(id);

            switch (await OnlyAccount())
            {
                case AccountsNumbers.DefaultIsOnlyRootAccount:
                    _logger.LogInformation("{UserId} could not be created, another account already exists", Constants.DefaultAdminAccount);
                    return;
                case AccountsNumbers.MultipleAccounts:
                    await ValidateOrClearDefaultUserAsync(id, true);
                    return;
                case AccountsNumbers.NoAccounts:
                    break;
                case AccountsNumbers.NoRootAccount:
                    break;
            }

            await CreateDefaultUserAsync(id);
        }

        //Suggestion: Perform count directly on database (Eg. using LINQ or SQL)
        public async Task<AccountsNumbers> OnlyAccount()
        {

            var rootUsers = await _userManager.GetUsersInRoleAsync(Constants.RootRole);
            int rootCount = rootUsers.Count();

            if (rootCount == 1 && await ValidateDefaultUserAsync(rootUsers.First()))
            {
                return AccountsNumbers.DefaultIsOnlyRootAccount;
            }

            var users = _userManager.Users;
            int userCount = users.Count();

            if (userCount > 0 && rootCount > 0)
            {
                return AccountsNumbers.MultipleAccounts;
            }

            if (userCount == 0)
            {
                return AccountsNumbers.NoAccounts;
            }

            return AccountsNumbers.NoRootAccount;
        }

        public async Task ValidateOrClearDefaultUserAsync(string id, bool force = false)
        {
            ApplicationUser userResult = await _userManager.FindByIdAsync(id);
            if (await ValidateDefaultUserAsync(userResult) && !force)
            {
                _logger.LogInformation("Valid {UserId} already exists", Constants.DefaultAdminAccount);
                return;
            }

            if (userResult != null)
            {
                var deleteResult = await _userManager.DeleteAsync(userResult);
                if (!deleteResult.Succeeded)
                {
                    _logger.LogError("{UserId} couldn't be deleted! This may pose a security risk for your application. Will attempt to delete again at next reboot", Constants.DefaultAdminAccount);
                }
                _logger.LogInformation("{UserId} deleted", Constants.DefaultAdminAccount);
                DeleteDefaultAccountFile();
            }
        }

        public async Task<bool> ValidateDefaultUserAsync(ApplicationUser user)
        {
            if (user == null || user.UserName != Constants.DefaultAdminName)
            {
                return false;
            }

            if (!await _userManager.HasPasswordAsync(user))
            {
                return false;
            }

            if (!await _userManager.IsInRoleAsync(user, Constants.RootRole))
            {
                return false;
            }

            return true;
        }

        private async Task CreateDefaultUserAsync(string id)
        {
            ApplicationUser user = new ApplicationUser()
            {
                Id = id,
                UserName = Constants.DefaultAdminName
            };

            var result = await _userManager.CreateAsync(user);
            if (!result.Succeeded)
            {
                _logger.LogError("Couldn't create {UserId}", Constants.DefaultAdminAccount);
                return;
            }

            result = await _userManager.AddToRoleAsync(user, Constants.RootRole);
            if (!result.Succeeded)
            {
                _logger.LogError("Couldn't add role to {UserId}", Constants.DefaultAdminAccount);
                return;
            }

            result = await _userManager.AddToRoleAsync(user, Constants.AdminRole);
            if (!result.Succeeded)
            {
                _logger.LogError("Couldn't add role to {UserId}", Constants.DefaultAdminAccount);
                return;
            }

            string password = Guid.NewGuid().ToString();
            result = await _userManager.AddPasswordAsync(user, password);
            if (!result.Succeeded)
            {
                _logger.LogError("Couldn't add password to {UserId} ", Constants.DefaultAdminAccount);
                return;
            }
            _logger.LogWarning("{UserId} created. This action potential exposes your interface, creating a new account and restarting this web interface will disable the default admin account", Constants.DefaultAdminAccount);

            string warningTag = "! - Warning - !";
            var path = GetDefaultAccountFilePath();
            DeleteDefaultAccountFile();
            _fileSystem.File.WriteAllText(path, $"{warningTag}\nThis account is unsecure. Please setup a personal account.\n{warningTag}\nUsername: {Constants.DefaultAdminName}\nPassword: {password}");
        }

        public void DeleteDefaultAccountFile()
        {
            var path = GetDefaultAccountFilePath();
            try
            {
                _fileSystem.File.Delete(path);
            }
            catch
            {
                _logger.LogInformation("Couldn't delete DefaultAccount file");
                return;
            }
            _logger.LogInformation("DefaultAccount file deleted");
        }

        private static string GetDefaultAccountFilePath()
        {
            string path = AppDomain.CurrentDomain.BaseDirectory!;
            path = Path.Combine(path, Constants.DefaultAdminFile);
            return path;
        }
    }
}
