using FactorioWebInterface.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace FactorioWebInterface.Hubs
{
    [Authorize]
    public class FactorioModHub : Hub<IFactorioModClientMethods>
    {
        private readonly FactorioModManager _factorioModManager;
        private readonly IHubContext<FactorioControlHub, IFactorioControlClientMethods> _factorioControlHub;

        public FactorioModHub(FactorioModManager factorioModManager,
            IHubContext<FactorioControlHub, IFactorioControlClientMethods> factorioControlHub)
        {
            _factorioModManager = factorioModManager;
            _factorioControlHub = factorioControlHub;
        }

        public Task<ModPackMetaData[]> GetModPacks()
        {
            return Task.FromResult(_factorioModManager.GetModPacks());
        }

        public Task<Result> CreateModPack(string name)
        {
            var result = _factorioModManager.CreateModPack(name);

            if (result.Success)
            {
                var modPacks = _factorioModManager.GetModPacks();
                Clients.All.SendModPacks(modPacks);
                _factorioControlHub.Clients.All.SendModPacks(modPacks);
            }

            return Task.FromResult(result);
        }

        public Task<Result> DeleteModPack(string name)
        {
            var result = _factorioModManager.DeleteModPack(name);

            if (result.Success)
            {
                var modPacks = _factorioModManager.GetModPacks();
                Clients.All.SendModPacks(modPacks);
                _factorioControlHub.Clients.All.SendModPacks(modPacks);
            }

            return Task.FromResult(result);
        }

        public Task<Result> RenameModPack(string name, string newName)
        {
            var result = _factorioModManager.RenameModPack(name, newName);

            if (result.Success)
            {
                var modPacks = _factorioModManager.GetModPacks();
                Clients.All.SendModPacks(modPacks);
                _factorioControlHub.Clients.All.SendModPacks(modPacks);
            }

            return Task.FromResult(result);
        }

        public Task<ModPackFileMetaData[]> GetModPackFiles(string name)
        {
            return Task.FromResult(_factorioModManager.GetModPackFiles(name));
        }

        public Task<Result> DeleteModPackFiles(string modPack, string[] files)
        {
            var result = _factorioModManager.DeleteModPackFiles(modPack, files);

            Clients.All.SendModPackFiles(modPack, _factorioModManager.GetModPackFiles(modPack));

            var modPacks = _factorioModManager.GetModPacks();
            Clients.All.SendModPacks(modPacks);
            _factorioControlHub.Clients.All.SendModPacks(modPacks);

            return Task.FromResult(result);
        }
    }
}
