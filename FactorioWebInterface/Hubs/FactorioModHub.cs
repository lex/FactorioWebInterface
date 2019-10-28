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
        private readonly IFactorioModManager _factorioModManager;

        public FactorioModHub(IFactorioModManager factorioModManager)
        {
            _factorioModManager = factorioModManager;
        }

        public Task RequestModPacks()
        {
            var client = Clients.Client(Context.ConnectionId);

            _ = Task.Run(() =>
            {
                var packs = _factorioModManager.GetModPacks();
                var data = CollectionChangedData.Reset(packs);

                _ = client.SendModPacks(data);
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
                var files = _factorioModManager.GetModPackFiles(name);
                var data = CollectionChangedData.Reset(files);

                _ = client.SendModPackFiles(name, data);
            });

            return Task.CompletedTask;
        }

        public Task<Result> DeleteModPackFiles(string modPack, string[] files)
        {
            var result = _factorioModManager.DeleteModPackFiles(modPack, files);
            return Task.FromResult(result);
        }

        public Task<Result> CopyModPackFiles(string sourceModPack, string targetModPack, string[] files)
        {
            var result = _factorioModManager.CopyModPackFiles(sourceModPack, targetModPack, files);
            return Task.FromResult(result);
        }

        public Task<Result> MoveModPackFiles(string sourceModPack, string targetModPack, string[] files)
        {
            var result = _factorioModManager.MoveModPackFiles(sourceModPack, targetModPack, files);
            return Task.FromResult(result);
        }
    }
}
