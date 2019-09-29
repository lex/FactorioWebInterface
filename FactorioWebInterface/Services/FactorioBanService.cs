using FactorioWebInterface.Data;
using FactorioWebInterface.Models;
using FactorioWebInterface.Utils;
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
    public interface IFactorioBanService
    {
        event EventHandler<IFactorioBanService, FactorioBanEventArgs> BanChanged;
        Task<bool> AddBan(Ban ban, string serverId, bool synchronizeWithServers, string actor);
        Task<Result> AddBanFromWeb(Ban ban, bool synchronizeWithServers, string actor);
        Task DoBanFromGameOutput(FactorioServerData serverData, string content);
        Task<Ban[]> GetBansAsync();
        Task<string[]> GetBanUserNamesAsync();
        Task<bool> RemoveBan(string username, string serverId, bool synchronizeWithServers, string actor);
        Task<Result> RemoveBanFromWeb(string username, bool synchronizeWithServers, string actor);
        Task DoUnBanFromGameOutput(FactorioServerData serverData, string content);
        Task<Result> BuildBanList(string serverBanListPath);
    }

    public class FactorioBanService : IFactorioBanService
    {
        private static readonly JsonSerializerSettings banListSerializerSettings = new JsonSerializerSettings()
        {
            Formatting = Formatting.Indented,
            NullValueHandling = NullValueHandling.Ignore
        };

        private readonly DbContextFactory _dbContextFactory;
        private readonly ILogger<IFactorioBanService> _logger;

        public event EventHandler<IFactorioBanService, FactorioBanEventArgs> BanChanged;

        public FactorioBanService(DbContextFactory dbContextFactory, ILogger<IFactorioBanService> logger)
        {
            _dbContextFactory = dbContextFactory;
            _logger = logger;
        }

        public async Task<Ban[]> GetBansAsync()
        {
            var db = _dbContextFactory.Create<ApplicationDbContext>();
            return await db.Bans.AsNoTracking().ToArrayAsync();
        }

        public async Task<string[]> GetBanUserNamesAsync()
        {
            var db = _dbContextFactory.Create<ApplicationDbContext>();
            return await db.Bans
                .AsNoTracking()
                .Select(x => x.Username)
                .OrderBy(x => x.ToLowerInvariant())
                .ToArrayAsync();
        }

        public async Task<Result> AddBanFromWeb(Ban ban, bool synchronizeWithServers, string actor)
        {
            List<Error> errors = new List<Error>();

            if (string.IsNullOrWhiteSpace(ban.Username))
            {
                errors.Add(new Error(Constants.RequiredFieldErrorKey, nameof(ban.Username)));
            }
            if (string.IsNullOrWhiteSpace(ban.Reason))
            {
                errors.Add(new Error(Constants.RequiredFieldErrorKey, nameof(ban.Reason)));
            }
            if (string.IsNullOrWhiteSpace(ban.Admin))
            {
                errors.Add(new Error(Constants.RequiredFieldErrorKey, nameof(ban.Admin)));
            }
            if (ban.DateTime == default)
            {
                errors.Add(new Error(Constants.RequiredFieldErrorKey, nameof(ban.DateTime)));
            }

            if (errors.Count != 0)
            {
                return Result.Failure(errors);
            }

            bool added = await AddBan(ban, "", synchronizeWithServers, actor);
            if (added)
            {
                return Result.OK;
            }
            else
            {
                return Result.Failure(Constants.FailedToAddBanToDatabaseErrorKey);
            }
        }

        public async Task DoBanFromGameOutput(FactorioServerData serverData, string content)
        {
            bool syncBans = await serverData.LockAsync(fsmd => fsmd.ServerExtraSettings.SyncBans);
            if (!syncBans)
            {
                return;
            }

            var ban = BanParser.FromBanGameOutput(content);
            if (ban == null || ban.Admin == Constants.ServerPlayerName)
            {
                return;
            }

            await AddBan(ban, serverData.ServerId, true, ban.Admin);
        }

        public async Task<bool> AddBan(Ban ban, string serverId, bool synchronizeWithServers, string actor)
        {
            bool added = await AddBanToDatabase(ban);
            if (added)
            {
                var changedData = CollectionChangedData.Add(new[] { ban });
                var ev = new FactorioBanEventArgs(synchronizeWithServers, serverId, changedData);

                _ = Task.Run(() => BanChanged?.Invoke(this, ev));

                LogBan(ban, actor);
            }

            return added;
        }

        private async Task<bool> AddBanToDatabase(Ban ban)
        {
            ban.Username = ban.Username.ToLowerInvariant();

            var db = _dbContextFactory.Create<ApplicationDbContext>();

            int retryCount = 10;
            while (retryCount >= 0)
            {
                var old = await db.Bans.FirstOrDefaultAsync(b => b.Username == ban.Username);

                try
                {
                    if (old == null)
                    {
                        db.Add(ban);
                    }
                    else
                    {
                        old.Admin = ban.Admin;
                        old.DateTime = ban.DateTime;
                        old.Reason = ban.Reason;
                        db.Update(old);
                    }

                    await db.SaveChangesAsync();

                    return true;
                }
                catch (DbUpdateConcurrencyException)
                {
                    // This exception is thrown if the old entry no longer exists in the database 
                    // when trying to update it. The solution is to remove the old cached entry
                    // and try again.
                    if (old != null)
                    {
                        db.Entry(old).State = EntityState.Detached;
                    }
                    retryCount--;
                }
                catch (DbUpdateException)
                {
                    // This exception is thrown if the UNQIUE constraint fails, meaning the DataSet
                    // Key pair already exists, when adding a new entry. The solution is to remove
                    // the cached new entry so that the old entry is fetched from the database not
                    // from the cache. Then the new entry can be properly compared and updated.
                    db.Entry(ban).State = EntityState.Detached;
                    retryCount--;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, nameof(AddBanToDatabase));
                    return false;
                }
            }

            _logger.LogWarning("AddBanToDatabase failed to add ban: {@Ban}", ban);
            return false;
        }

        private void LogBan(Ban ban, string actor)
        {
            _logger.LogInformation("[BAN] {username} was banned by {admin}. Reason: {reason} Actor: {actor}", ban.Username, ban.Admin, ban.Reason, actor);
        }

        public async Task<Result> RemoveBanFromWeb(string username, bool synchronizeWithServers, string actor)
        {
            List<Error> errors = new List<Error>();

            if (string.IsNullOrWhiteSpace(username))
            {
                errors.Add(new Error(Constants.RequiredFieldErrorKey, nameof(username)));
            }
            if (string.IsNullOrWhiteSpace(actor))
            {
                errors.Add(new Error(Constants.RequiredFieldErrorKey, nameof(actor)));
            }

            if (errors.Count != 0)
            {
                return Result.Failure(errors);
            }

            bool removed = await RemoveBan(username, "", synchronizeWithServers, actor);
            if (removed)
            {
                return Result.OK;
            }
            else
            {
                return Result.Failure(Constants.FailedToRemoveBanFromDatabaseErrorKey);
            }
        }

        public async Task DoUnBanFromGameOutput(FactorioServerData serverData, string content)
        {
            bool syncBans = await serverData.LockAsync(fsmd => fsmd.ServerExtraSettings.SyncBans);
            if (!syncBans)
            {
                return;
            }

            var ban = BanParser.FromUnBanGameOutput(content);
            if (ban == null || ban.Admin == Constants.ServerPlayerName)
            {
                return;
            }

            await RemoveBan(ban.Username, serverData.ServerId, true, ban.Admin);
        }

        public async Task<bool> RemoveBan(string username, string serverId, bool synchronizeWithServers, string actor)
        {
            bool removed = await RemoveBanFromDatabase(username);
            if (removed)
            {
                var changedData = CollectionChangedData.Remove(new[] { new Ban { Username = username } });
                var ev = new FactorioBanEventArgs(synchronizeWithServers, serverId, changedData);

                _ = Task.Run(() => BanChanged?.Invoke(this, ev));

                LogUnBan(username, actor);
            }

            return removed;
        }

        public async Task<Result> BuildBanList(string serverBanListPath)
        {
            try
            {
                var db = _dbContextFactory.Create<ApplicationDbContext>();

                var bans = await db.Bans.Select(b => new ServerBan()
                {
                    Username = b.Username,
                    Address = b.Address,
                    Reason = b.Reason
                })
                .ToArrayAsync();

                string data = JsonConvert.SerializeObject(bans, banListSerializerSettings);

                await File.WriteAllTextAsync(serverBanListPath, data);

                return Result.OK;
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(BuildBanList));

                return Result.Failure(Constants.UnexpectedErrorKey, e.Message);
            }
        }

        private async Task<bool> RemoveBanFromDatabase(string username)
        {
            try
            {
                var db = _dbContextFactory.Create<ApplicationDbContext>();

                var old = await db.Bans.SingleOrDefaultAsync(b => b.Username == username);
                if (old == null)
                {
                    return true;
                }

                db.Bans.Remove(old);
                await db.SaveChangesAsync();

                return true;
            }
            catch (DbUpdateConcurrencyException)
            {
                // The ban has already been removed.
                return true;
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(RemoveBanFromDatabase));
                return false;
            }
        }

        private void LogUnBan(string username, string actor)
        {
            _logger.LogInformation("[UNBAN] {username} was unbanned by: {actor}", username, actor);
        }
    }
}
