using FactorioWebInterface.Data;
using Microsoft.AspNetCore.Identity;
using Serilog;
using System;
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

            await ClearDefaultUserAsync(id);

            switch (await OnlyAccount())
            {
                case AccountsNumbers.DefaultIsOnlyRootAccount:
                case AccountsNumbers.OnlyDefaultAccount:
                    Log.Information(Constants.DefaultAdminAccount + " could not be created, another account already exists");
                    return;
                case AccountsNumbers.MultipleAccounts:
                    await ClearDefaultUserAsync(id, true);
                    return;
                case AccountsNumbers.NoAccounts:
                    break;
            }

            await CreateDefaultUserAsync(id);
        }

        //Todo: Perform count directly on database
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

        private async Task ClearDefaultUserAsync(string id, bool force = false)
        {
            ApplicationUser userResult = await _userManager.FindByIdAsync(id);
            if (await ValidateDefaultUserAsync(userResult) && !force)
            {
                Log.Information("Valid " + Constants.DefaultAdminAccount + " already exists");
                return;
            }

            if (userResult != null)
            {
                var deleteResult = await _userManager.DeleteAsync(userResult);
                if (!deleteResult.Succeeded)
                {
                    Log.Error(Constants.DefaultAdminAccount + " couldn't be deleted! This may pose a security risk for your application. Will attempt to delete again at next reboot");
                }
                Log.Information(Constants.DefaultAdminAccount + " deleted");
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
                Log.Error("Couldn't create " + Constants.DefaultAdminAccount);
                return;
            }

            result = await _userManager.AddToRoleAsync(user, Constants.RootRole);
            if (!result.Succeeded)
            {
                Log.Error("Couldn't add role to " + Constants.DefaultAdminAccount);
                return;
            }

            result = await _userManager.AddToRoleAsync(user, Constants.AdminRole);
            if (!result.Succeeded)
            {
                Log.Error("Couldn't add role to " + Constants.DefaultAdminAccount);
                return;
            }

            string password = Guid.NewGuid().ToString();
            result = await _userManager.AddPasswordAsync(user, password);
            if (!result.Succeeded)
            {
                Log.Error("Couldn't add password to " + Constants.DefaultAdminAccount);
                return;
            }
            Log.Warning(Constants.DefaultAdminAccount + " named \'" + userName + "\' created with the password: " + password + "\nThis action potential exposes your interface, creating a new account and restarting this web interface will disable the default admin account");
        }
    }
}
