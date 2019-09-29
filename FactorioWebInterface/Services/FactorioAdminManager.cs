using FactorioWebInterface.Data;
using FactorioWebInterface.Hubs;
using FactorioWebInterface.Models;
using FactorioWebInterface.Utils;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace FactorioWebInterface.Services
{
    public interface IFactorioAdminManager
    {
        event EventHandler<FactorioAdminManager, CollectionChangedData<Admin>> AdminsChanged;
        event EventHandler<FactorioAdminManager, FactorioAdminListChangedEventArgs> AdminListChanged;

        Task<Result> AddAdmins(string data);
        Task<Admin[]> GetAdmins();
        Task<Result> RemoveAdmin(string name);
        Task<Result> BuildAdminList(FactorioServerMutableData mutableData);
    }

    public class FactorioAdminManager : IFactorioAdminManager
    {
        private readonly DbContextFactory _dbContextFactory;
        private readonly IHubContext<FactorioAdminHub, IFactorioAdminClientMethods> _adminHub;
        private readonly ILogger<FactorioAdminManager> _logger;

        public event EventHandler<FactorioAdminManager, CollectionChangedData<Admin>> AdminsChanged;
        public event EventHandler<FactorioAdminManager, FactorioAdminListChangedEventArgs> AdminListChanged;

        public FactorioAdminManager(DbContextFactory dbContextFactory,
            IHubContext<FactorioAdminHub, IFactorioAdminClientMethods> adminHub,
            ILogger<FactorioAdminManager> logger)
        {
            _dbContextFactory = dbContextFactory;
            _adminHub = adminHub;
            _logger = logger;
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

        public async Task<Result> BuildAdminList(FactorioServerMutableData mutableData)
        {
            try
            {
                var a = await GetAdmins();
                var admins = a.Select(x => x.Name).ToArray();

                var adminData = JsonConvert.SerializeObject(admins, Formatting.Indented);
                var writeTask = File.WriteAllTextAsync(mutableData.ServerAdminListPath, adminData);

                mutableData.ServerAdminList = admins;

                var settings = mutableData.ServerWebEditableSettings;
                if (settings != null)
                {
                    settings.Admins = admins;
                }

                var items = new Dictionary<string, object>
                {
                    { nameof(FactorioServerSettingsWebEditable.Admins), admins }
                };
                var changedData = KeyValueCollectionChangedData.Add(items);

                _ = Task.Run(() => AdminListChanged?.Invoke(this, new FactorioAdminListChangedEventArgs(mutableData.ServerId, changedData)));

                await writeTask;

                return Result.OK;
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(BuildAdminList));

                return Result.Failure(Constants.UnexpectedErrorKey, e.Message);
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

                    _ = Task.Run(() => AdminsChanged?.Invoke(this, CollectionChangedData.Add(newAdmins)));

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

                        var ev = CollectionChangedData.Remove(new[] { admin });
                        _ = Task.Run(() => AdminsChanged?.Invoke(this, ev));

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
