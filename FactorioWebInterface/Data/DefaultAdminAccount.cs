using FactorioWebInterface.Options;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Serilog;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace FactorioWebInterface.Data
{
    public class DefaultAdminAccount
    {
        private readonly DefaultAdminAccountOption _accountOption;
        private readonly UserManager<ApplicationUser> _userManager;

        public DefaultAdminAccount(IOptions<DefaultAdminAccountOption> accountOption, UserManager<ApplicationUser> userManager)
        {
            _accountOption = accountOption.Value;
            _userManager = userManager;
        }

        public async Task SetupDefaultUserAsync()
        {
            string id = DefaultAdminAccountOption.DefaultAdminAccount;

            await ClearDefaultUserAsync(id);

            if (!OnlyAccount())
            {
                Log.Information(DefaultAdminAccountOption.DefaultAdminAccount + " was not created, another account already exists");
            }

            if (!_accountOption.Enabled)
            {
                return;
            }

            await CreateDefaultUserAsync(id);
        }

        private bool OnlyAccount()
        {
            int users = _userManager.Users.Count();
            if (users > 0)
            {
                return false;
            }
            return true;
        }

        private async Task ClearDefaultUserAsync(string id)
        {
            ApplicationUser userResult = await _userManager.FindByIdAsync(id);
            if (userResult != null)
            {
                var deleteResult = await _userManager.DeleteAsync(userResult);
                if (!deleteResult.Succeeded)
                {
                    var lockoutResult = await _userManager.SetLockoutEnabledAsync(userResult, true);
                    if (lockoutResult.Succeeded)
                    {
                        Log.Information(DefaultAdminAccountOption.DefaultAdminAccount + " couldn't be deleted, locking out account instead");
                    }
                    return;
                }
                Log.Information(DefaultAdminAccountOption.DefaultAdminAccount + " deleted");
            }
        }

        private async Task CreateDefaultUserAsync(string id)
        {
            ApplicationUser user = new ApplicationUser()
            {
                Id = id,
                UserName = _accountOption.Username
            };

            var result = await _userManager.CreateAsync(user);
            if (!result.Succeeded)
            {
                Log.Error("Couldn't create " + DefaultAdminAccountOption.DefaultAdminAccount);
                return;
            }

            result = await _userManager.AddToRoleAsync(user, Constants.AdminRole);
            if (!result.Succeeded)
            {
                Log.Error("Couldn't add role to " + DefaultAdminAccountOption.DefaultAdminAccount);
                return;
            }
            string password = Guid.NewGuid().ToString();
            result = await _userManager.AddPasswordAsync(user, password);
            if (!result.Succeeded)
            {
                Log.Error("Couldn't add password to " + DefaultAdminAccountOption.DefaultAdminAccount);
                return;
            }
            Log.Warning(DefaultAdminAccountOption.DefaultAdminAccount + " named \'" + _accountOption.Username + "\' created with the password: " + password + "\nThis action potential exposes your interface, creating a new account and restarting this web interface will disable the default admin account");
        }
    }
}
