using FactorioWebInterface.Data;
using Microsoft.AspNetCore.Identity;
using Serilog;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace FactorioWebInterface.Services
{
    public class DefaultAdminAccountService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly string userName = "Admin";

        public DefaultAdminAccountService(UserManager<ApplicationUser> userManager)
        {
            _userManager = userManager;
        }

        private enum AccountsNumbers
        {
            NoAccounts,
            OnlyDefaultAccount,
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
                case AccountsNumbers.OnlyDefaultAccount:
                    Log.Information("{UserId} could not be created, another account already exists", Constants.DefaultAdminAccount);
                    return;
                case AccountsNumbers.MultipleAccounts:
                    await ValidateOrClearDefaultUserAsync(id, true);
                    return;
                case AccountsNumbers.NoAccounts:
                    break;
            }

            await CreateDefaultUserAsync(id);
        }

        //Suggestion: Perform count directly on database (Eg. using LINQ or SQL)
        private async Task<AccountsNumbers> OnlyAccount()
        {

            var rootUsers = await _userManager.GetUsersInRoleAsync(Constants.RootRole);
            int rootCount = rootUsers.Count();

            if (rootCount == 1 && await ValidateDefaultUserAsync(rootUsers.First()))
            {
                return AccountsNumbers.DefaultIsOnlyRootAccount;
            }

            var users = _userManager.Users;
            int userCount = users.Count();
            if (userCount == 1 && await ValidateDefaultUserAsync(users.First()))
            {
                return AccountsNumbers.OnlyDefaultAccount;
            }

            if (userCount > 0 && rootCount > 0)
            {
                return AccountsNumbers.MultipleAccounts;
            }

            return AccountsNumbers.NoAccounts;
        }

        private async Task ValidateOrClearDefaultUserAsync(string id, bool force = false)
        {
            ApplicationUser userResult = await _userManager.FindByIdAsync(id);
            if (await ValidateDefaultUserAsync(userResult) && !force)
            {
                Log.Information("Valid {UserId} already exists", Constants.DefaultAdminAccount);
                return;
            }

            if (userResult != null)
            {
                var deleteResult = await _userManager.DeleteAsync(userResult);
                if (!deleteResult.Succeeded)
                {
                    Log.Error("{UserId} couldn't be deleted! This may pose a security risk for your application. Will attempt to delete again at next reboot", Constants.DefaultAdminAccount);
                }
                Log.Information("{UserId} deleted", Constants.DefaultAdminAccount);
            }
        }

        private async Task<bool> ValidateDefaultUserAsync(ApplicationUser user)
        {
            if (user == null || user.UserName != userName)
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
                UserName = userName
            };

            var result = await _userManager.CreateAsync(user);
            if (!result.Succeeded)
            {
                Log.Error("Couldn't create {UserId}", Constants.DefaultAdminAccount);
                return;
            }

            result = await _userManager.AddToRoleAsync(user, Constants.RootRole);
            if (!result.Succeeded)
            {
                Log.Error("Couldn't add role to {UserId}", Constants.DefaultAdminAccount);
                return;
            }

            result = await _userManager.AddToRoleAsync(user, Constants.AdminRole);
            if (!result.Succeeded)
            {
                Log.Error("Couldn't add role to {UserId}", Constants.DefaultAdminAccount);
                return;
            }

            string password = Guid.NewGuid().ToString();
            result = await _userManager.AddPasswordAsync(user, password);
            if (!result.Succeeded)
            {
                Log.Error("Couldn't add password to {UserId} ", Constants.DefaultAdminAccount);
                return;
            }
            Log.Warning("{UserId} created. This action potential exposes your interface, creating a new account and restarting this web interface will disable the default admin account", Constants.DefaultAdminAccount);

            string warningTag = "! - Warning - !";
            var path = GetDefaultAccountFilePath();
            RemoveDefaultAccountFile();
            File.WriteAllText(path, $"{warningTag}\nThis account is unsecure. Please setup a personal account.\n{warningTag}\nUsername: {userName}\nPassword: {password}");
        }

        private void RemoveDefaultAccountFile()
        {
            var path = GetDefaultAccountFilePath();
            try
            {
                File.Delete(path);
            } catch {
                Log.Information("Couldn't delete DefaultAccount file");
                return;
            }
            Log.Information("DefaultAccount file deleted");
        }

        private string GetDefaultAccountFilePath()
        {
            string path = AppDomain.CurrentDomain.BaseDirectory!;
            path = Path.Combine(path, "logs/DefaultUser.txt");
            return path;
        }
    }
}
