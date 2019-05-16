using FactorioWebInterface.Models;
using FactorioWebInterface.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace FactorioWebInterface.Hubs
{
    [Authorize]
    public class FactorioModHub : Hub<IFactorioModClientMethods>
    {
        private readonly FactorioModManager _factorioModManager;

        public FactorioModHub(FactorioModManager factorioModManager)
        {
            _factorioModManager = factorioModManager;
        }

        public Task RequestModPacks()
        {
            var client = Clients.Client(Context.ConnectionId);

            _ = Task.Run(() =>
            {
                var data = _factorioModManager.GetModPacks();

                var tableData = new TableData<ModPackMetaData>()
                {
                    Type = TableDataType.Reset,
                    Rows = data
                };

                _ = client.SendModPacks(tableData);
            });

            return Task.CompletedTask;
        }

        public Task<Result> CreateModPack(string name)
        {
            var result = _factorioModManager.CreateModPack(name);
            return Task.FromResult(result);
        }

        public Task<Result> DeleteModPack(string name)
        {
            var result = _factorioModManager.DeleteModPack(name);
            return Task.FromResult(result);
        }

        public Task<Result> RenameModPack(string name, string newName)
        {
            var result = _factorioModManager.RenameModPack(name, newName);
            return Task.FromResult(result);
        }

        public Task RequestModPackFiles(string name)
        {
            var client = Clients.Client(Context.ConnectionId);

            _ = Task.Run(() =>
            {
                var data = _factorioModManager.GetModPackFiles(name);

                var tableData = new TableData<ModPackFileMetaData>()
                {
                    Type = TableDataType.Reset,
                    Rows = data
                };

                _ = client.SendModPackFiles(name, tableData);
            });

            return Task.CompletedTask;
        }

        public Task<Result> DeleteModPackFiles(string modPack, string[] files)
        {
            var result = _factorioModManager.DeleteModPackFiles(modPack, files);
            return Task.FromResult(result);
        }
    }
}
