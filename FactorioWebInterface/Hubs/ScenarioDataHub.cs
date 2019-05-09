using FactorioWebInterface.Data;
using FactorioWebInterface.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading.Tasks;

namespace FactorioWebInterface.Hubs
{
    [Authorize]
    public class ScenarioDataHub : Hub<IScenarioDataClientMethods>
    {
        private IFactorioServerManager _factorioServerManager;
        private ScenarioDataManger _scenarioDataManger;

        public ScenarioDataHub(IFactorioServerManager factorioServerManager, ScenarioDataManger scenarioDataManger)
        {
            _factorioServerManager = factorioServerManager;
            _scenarioDataManger = scenarioDataManger;
        }

        public override Task OnDisconnectedAsync(Exception exception)
        {
            string connectionId = Context.ConnectionId;
            if (Context.Items.TryGetValue(connectionId, out object oldDataSet))
            {
                Groups.RemoveFromGroupAsync(connectionId, (string)oldDataSet);
            }
            return base.OnDisconnectedAsync(exception);
        }

        public async Task TrackDataSet(string dataSet)
        {
            string connectionId = Context.ConnectionId;

            if (Context.Items.TryGetValue(connectionId, out object oldDataSet))
            {
                await Groups.RemoveFromGroupAsync(connectionId, (string)oldDataSet);
            }

            Context.Items[connectionId] = dataSet;
            await Groups.AddToGroupAsync(connectionId, dataSet);
        }

        public Task RequestAllDataSets()
        {
            var client = Clients.Client(Context.ConnectionId);

            async Task Reply()
            {
                var data = await _scenarioDataManger.GetAllDataSets();
                await client.SendDataSets(data);
            }
            _ = Reply();

            return Task.CompletedTask;
        }

        public Task RequestAllDataForDataSet(string dataSet)
        {
            var client = Clients.Client(Context.ConnectionId);

            async Task Reply()
            {
                var data = await _scenarioDataManger.GetAllEntries(dataSet);

                var tableData = new TableData<ScenarioDataKeyValue>()
                {
                    Type = TableDataType.Reset,
                    Rows = data
                };

                await client.SendEntries(dataSet, tableData);
            }
            _ = Reply();

            return Task.FromResult(0);
        }

        public Task UpdateData(ScenarioDataEntry data)
        {
            return _scenarioDataManger.UpdateEntry(data);
        }
    }
}
