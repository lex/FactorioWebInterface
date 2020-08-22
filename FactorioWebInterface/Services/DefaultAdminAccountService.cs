using FactorioWebInterface.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
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

        public async Task SetupDefaultUserAsync()
        {
            if (await NoUsers())
            {
                await CreateDefaultUserAsync();
            }
        }

        private async Task<bool> NoUsers()
        {
            int count = await _userManager.Users.CountAsync();
            return count == 0;
        }

        private async Task CreateDefaultUserAsync()
        {
            ApplicationUser user = new ApplicationUser()
            {
                Id = Constants.DefaultAdminAccount,
                UserName = Constants.DefaultAdminName
            };

            var result = await _userManager.CreateAsync(user);
            if (!result.Succeeded)
            {
                _logger.LogError("Could not create {UserId}", Constants.DefaultAdminAccount);
                return;
            }

            result = await _userManager.AddToRoleAsync(user, Constants.RootRole);
            if (!result.Succeeded)
            {
                _logger.LogError("Could not add role to {UserId}", Constants.DefaultAdminAccount);
                return;
            }

            result = await _userManager.AddToRoleAsync(user, Constants.AdminRole);
            if (!result.Succeeded)
            {
                _logger.LogError("Could not add role to {UserId}", Constants.DefaultAdminAccount);
                return;
            }

            string password = Guid.NewGuid().ToString();
            result = await _userManager.AddPasswordAsync(user, password);
            if (!result.Succeeded)
            {
                _logger.LogError("Could not add password to {UserId} ", Constants.DefaultAdminAccount);
                return;
            }
            _logger.LogWarning("{UserId} created, see {passwordFile} for password. It is recommended to change the {UserId} password on the user's account page", Constants.DefaultAdminAccount, Constants.DefaultAdminFile, Constants.DefaultAdminAccount);

            const string warningTag = "! - Warning - !";
            string path = GetDefaultAccountFilePath();
            _fileSystem.File.WriteAllText(path, $"{warningTag}\nIt is recommended to change the {Constants.DefaultAdminName} password on the user's account page and to delete this file.\n{warningTag}\nUsername: {Constants.DefaultAdminName}\nPassword: {password}");
        }

        private string GetDefaultAccountFilePath()
        {
            string path = AppDomain.CurrentDomain.BaseDirectory!;
            return _fileSystem.Path.Combine(path, Constants.DefaultAdminFile);
        }
    }
}
