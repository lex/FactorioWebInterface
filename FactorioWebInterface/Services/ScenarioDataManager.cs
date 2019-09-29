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
    public class ScenarioDataManager
    {
        private readonly IDbContextFactory _dbContextFactory;
        private readonly ILogger<ScenarioDataManager> _logger;
        private readonly IHubContext<ScenarioDataHub, IScenarioDataClientMethods> _scenariolHub;

        public event EventHandler<ScenarioDataManager, ScenarioDataEntryChangedEventArgs> EntryChanged;

        public ScenarioDataManager(IDbContextFactory dbContextFactory,
            ILogger<ScenarioDataManager> logger,
            IHubContext<ScenarioDataHub, IScenarioDataClientMethods> scenariolHub)
        {
            _dbContextFactory = dbContextFactory;
            _logger = logger;
            _scenariolHub = scenariolHub;

            EntryChanged += ScenarioDataManger_EntryChanged;
        }

        private void ScenarioDataManger_EntryChanged(ScenarioDataManager sender, ScenarioDataEntryChangedEventArgs eventArgs)
        {
            var entry = eventArgs.ScenarioDataEntry;
            var value = entry.Value;
            var keyValue = new[] { new ScenarioDataKeyValue() { Key = entry.Key, Value = value } };

            CollectionChangedData<ScenarioDataKeyValue> changeData;
            if (value == null)
            {
                changeData = CollectionChangedData.Remove(keyValue);
            }
            else
            {
                changeData = CollectionChangedData.Add(keyValue);
            }

            _scenariolHub.Clients.Group(entry.DataSet).SendEntries(entry.DataSet, changeData);
        }

        public async Task<string[]> GetAllDataSets()
        {
            try
            {
                var db = _dbContextFactory.Create<ScenarioDbContext>();
                return await db.ScenarioDataEntries
                    .AsNoTracking()
                    .Select(x => x.DataSet)
                    .Distinct()
                    .ToArrayAsync();
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(GetAllDataSets));
                return new string[0];
            }
        }

        public async Task<string> GetValue(string dataSet, string key)
        {
            if (dataSet == null || key == null)
            {
                return null;
            }

            var db = _dbContextFactory.Create<ScenarioDbContext>();
            return await db.ScenarioDataEntries
                .AsNoTracking()
                .Where(x => x.DataSet == dataSet && x.Key == key)
                .Select(x => x.Value)
                .FirstOrDefaultAsync();
        }

        public async Task<ScenarioDataKeyValue[]> GetAllEntries(string dataSet)
        {
            if (dataSet == null)
            {
                return Array.Empty<ScenarioDataKeyValue>();
            }

            try
            {
                var db = _dbContextFactory.Create<ScenarioDbContext>();
                return await db.ScenarioDataEntries
                    .AsNoTracking()
                    .Where(x => x.DataSet == dataSet)
                    .Select(x => new ScenarioDataKeyValue() { Key = x.Key, Value = x.Value })
                    .ToArrayAsync();
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(GetAllEntries));
                return Array.Empty<ScenarioDataKeyValue>();
            }
        }

        /// <summary>
        /// Updates the sceanrio data entry and rasies the <see cref="EntryChanged"/> event.
        /// </summary>
        /// <param name="data"></param>
        /// <param name="serverId">Source server for data, empty string if from web.</param>
        /// <returns></returns>
        public async Task UpdateEntry(ScenarioDataEntry data, string serverId = "")
        {
            if (data.DataSet == null || data.Key == null)
            {
                return;
            }

            await UpdateDataSetDb(data);
            EntryChanged?.Invoke(this, new ScenarioDataEntryChangedEventArgs(data, serverId));
        }

        private async Task UpdateDataSetDb(ScenarioDataEntry data)
        {
            var db = _dbContextFactory.Create<ScenarioDbContext>();

            int retryCount = 10;
            while (retryCount >= 0)
            {
                var old = await db.ScenarioDataEntries.FirstOrDefaultAsync(x => x.DataSet == data.DataSet && x.Key == data.Key);

                try
                {
                    if (data.Value == null)
                    {
                        if (old != null)
                        {
                            db.Remove(old);
                            await db.SaveChangesAsync();
                        }
                    }
                    else
                    {
                        if (old != null)
                        {
                            db.Entry(old).Property(x => x.Value).CurrentValue = data.Value;
                        }
                        else
                        {
                            db.Add(data);
                        }
                        await db.SaveChangesAsync();
                    }

                    return;
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
                    db.Entry(data).State = EntityState.Detached;
                    retryCount--;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, nameof(UpdateDataSetDb));
                    return;
                }
            }

            _logger.LogWarning("UpdateDataSetDb failed to update data. DataSet: {DataSet}, Key: {Key}, Value: {Value}", data.DataSet, data.Key, data.Value);
        }
    }
}
