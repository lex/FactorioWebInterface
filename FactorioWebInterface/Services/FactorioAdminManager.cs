using FactorioWebInterface.Data;
using FactorioWebInterface.Hubs;
using FactorioWebInterface.Models;
using FactorioWebInterface.Utils;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace FactorioWebInterface.Services
{
    public class FactorioAdminManager
    {
        private readonly DbContextFactory _dbContextFactory;
        private readonly IHubContext<FactorioAdminHub, IFactorioAdminClientMethods> _adminHub;
        private readonly ILogger<FactorioAdminManager> _logger;

        public event EventHandler<FactorioAdminManager, FactorioAdminsAddedEventArgs> AdminsAdded;
        public event EventHandler<FactorioAdminManager, FactorioAdminRemovedEventArgs> AdminRemoved;

        public FactorioAdminManager(DbContextFactory dbContextFactory,
            IHubContext<FactorioAdminHub, IFactorioAdminClientMethods> adminHub,
            ILogger<FactorioAdminManager> logger)
        {
            _dbContextFactory = dbContextFactory;
            _adminHub = adminHub;
            _logger = logger;

            AdminsAdded += FactorioAdminManager_AdminsAdded;
            AdminRemoved += FactorioAdminManager_AdminRemoved;
        }

        private void FactorioAdminManager_AdminsAdded(FactorioAdminManager sender, FactorioAdminsAddedEventArgs eventArgs)
        {
            var td = new TableData<Admin>()
            {
                Type = TableDataType.Update,
                Rows = eventArgs.Admins
            };
            _adminHub.Clients.All.SendAdmins(td);
        }

        private void FactorioAdminManager_AdminRemoved(FactorioAdminManager sender, FactorioAdminRemovedEventArgs eventArgs)
        {
            var td = new TableData<Admin>()
            {
                Type = TableDataType.Remove,
                Rows = new[] { eventArgs.Admin }
            };
            _adminHub.Clients.All.SendAdmins(td);
        }

        public async Task<Admin[]> GetAdmins()
        {
            var db = _dbContextFactory.Create<ApplicationDbContext>();
            return await db.Admins.AsNoTracking().ToArrayAsync();
        }

        public async Task<Result> AddAdmins(string data)
        {
            if (await AddAdminsToDatabase(data))
            {
                return Result.OK;
            }
            else
            {
                return Result.Failure(Constants.FailedToAddAdminsErrorKey, data);
            }
        }

        public async Task<Result> RemoveAdmin(string name)
        {
            if (await RemoveAdminFromDatabase(name))
            {
                return Result.OK;
            }
            else
            {
                return Result.Failure(Constants.FailedToRemoveAdminErrorKey, name);
            }
        }

        private async Task<bool> AddAdminsToDatabase(string data)
        {
            var db = _dbContextFactory.Create<ApplicationDbContext>();
            var newAdmins = data.Split(',').Select(x => new Admin { Name = x.Trim() }).ToArray();

            int retryCount = 10;
            while (retryCount >= 0)
            {
                var admins = db.Admins;

                try
                {
                    foreach (var admin in newAdmins)
                    {
                        var old = await admins.FirstOrDefaultAsync(x => x.Name == admin.Name);
                        if (old == null)
                        {
                            admins.Add(admin);
                        }
                    }

                    await db.SaveChangesAsync();

                    _ = Task.Run(() => AdminsAdded?.Invoke(this, new FactorioAdminsAddedEventArgs(newAdmins)));

                    return true;
                }
                catch (DbUpdateConcurrencyException)
                {
                    db = _dbContextFactory.Create<ApplicationDbContext>();
                }
                catch (DbUpdateException)
                {
                    db = _dbContextFactory.Create<ApplicationDbContext>();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, nameof(AddAdminsToDatabase));
                    return false;
                }

                retryCount--;
            }

            _logger.LogWarning("AddAdminsToDatabase failed to add admins: {@admins}", newAdmins);
            return false;
        }

        private async Task<bool> RemoveAdminFromDatabase(string name)
        {
            var db = _dbContextFactory.Create<ApplicationDbContext>();

            int retryCount = 10;
            while (retryCount >= 0)
            {
                var admins = db.Admins;

                try
                {
                    var admin = await admins.FirstOrDefaultAsync(a => a.Name == name);
                    if (admin != null)
                    {
                        admins.Remove(admin);
                        await db.SaveChangesAsync();

                        _ = Task.Run(() => AdminRemoved?.Invoke(this, new FactorioAdminRemovedEventArgs(admin)));

                        return true;
                    }
                }
                catch (DbUpdateConcurrencyException)
                {
                    db = _dbContextFactory.Create<ApplicationDbContext>();
                }
                catch (DbUpdateException)
                {
                    db = _dbContextFactory.Create<ApplicationDbContext>();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, nameof(AddAdminsToDatabase));
                    return false;
                }

                retryCount--;
            }

            _logger.LogWarning("RemoveAdminFromDatabase failed to remove admin: {admin}", name);
            return false;
        }
    }
}
