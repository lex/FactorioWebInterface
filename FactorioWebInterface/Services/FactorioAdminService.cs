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
using System.IO.Abstractions;
using System.Linq;
using System.Threading.Tasks;

namespace FactorioWebInterface.Services
{
    public interface IFactorioAdminService
    {
        event EventHandler<IFactorioAdminService, CollectionChangedData<Admin>> AdminsChanged;
        event EventHandler<IFactorioAdminService, FactorioAdminListChangedEventArgs> AdminListChanged;

        Task<Result> AddAdmins(string data);
        Task<Admin[]> GetAdmins();
        Task<Result> RemoveAdmin(string name);
        Task<Result> BuildAdminList(FactorioServerMutableData mutableData);
    }

    public class FactorioAdminService : IFactorioAdminService
    {
        private readonly IDbContextFactory _dbContextFactory;
        private readonly IHubContext<FactorioAdminHub, IFactorioAdminClientMethods> _adminHub;
        private readonly IFileSystem _fileSystem;
        private readonly ILogger<FactorioAdminService> _logger;

        public event EventHandler<IFactorioAdminService, CollectionChangedData<Admin>>? AdminsChanged;
        public event EventHandler<IFactorioAdminService, FactorioAdminListChangedEventArgs>? AdminListChanged;

        public FactorioAdminService(IDbContextFactory dbContextFactory,
            IHubContext<FactorioAdminHub, IFactorioAdminClientMethods> adminHub,
            IFileSystem fileSystem,
            ILogger<FactorioAdminService> logger)
        {
            _dbContextFactory = dbContextFactory;
            _adminHub = adminHub;
            _fileSystem = fileSystem;
            _logger = logger;
        }

        public async Task<Admin[]> GetAdmins()
        {
            using (var db = _dbContextFactory.Create<ApplicationDbContext>())
            {
                return await db.Admins.AsNoTracking().ToArrayAsync();
            }
        }

        public async Task<Result> AddAdmins(string data)
        {
            if (string.IsNullOrWhiteSpace(data))
            {
                return Result.OK;
            }

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
                var writeTask = _fileSystem.File.WriteAllTextAsync(mutableData.ServerAdminListPath, adminData);

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
            using (var db = _dbContextFactory.Create<ApplicationDbContext>())
            {
                var newAdmins = data.Split(',').Select(x => new Admin { Name = x.Trim() }).ToArray();
                var admins = db.Admins;

                foreach (var admin in newAdmins)
                {
                    admins.Add(admin);
                }

                int retryCount = 10;
                while (retryCount >= 0)
                {
                    try
                    {
                        if (await db.SaveChangesAsync() != 0)
                        {
                            _ = Task.Run(() => AdminsChanged?.Invoke(this, CollectionChangedData.Add(newAdmins)));
                        }

                        return true;
                    }
                    catch (DbUpdateConcurrencyException) { }
                    catch (DbUpdateException) { }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, nameof(AddAdminsToDatabase));
                        return false;
                    }

                    foreach (var admin in newAdmins)
                    {
                        await db.Entry(admin).ReloadAsync();
                    }

                    retryCount--;
                }

                _logger.LogWarning("AddAdminsToDatabase failed to add admins: {@admins}", newAdmins);
                return false;
            }
        }

        private async Task<bool> RemoveAdminFromDatabase(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
            {
                return true;
            }

            using (var db = _dbContextFactory.Create<ApplicationDbContext>())
            {
                var admins = db.Admins;
                var admin = new Admin() { Name = name };

                admins.Remove(admin);

                int retryCount = 10;
                while (retryCount >= 0)
                {
                    try
                    {
                        if (await db.SaveChangesAsync() != 0)
                        {
                            _ = Task.Run(() => AdminsChanged?.Invoke(this, CollectionChangedData.Remove(new[] { admin })));
                        }

                        return true;
                    }
                    catch (DbUpdateConcurrencyException)
                    {
                        // The ban has already been removed.
                        return true;
                    }
                    catch (DbUpdateException) { }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, nameof(AddAdminsToDatabase));
                        return false;
                    }

                    await db.Entry(admin).ReloadAsync();
                    retryCount--;
                }

                _logger.LogWarning("RemoveAdminFromDatabase failed to remove admin: {admin}", name);
                return false;
            }
        }
    }
}
