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

        public FactorioModHub(FactorioModManager factorioModManager)
        {
            _factorioModManager = factorioModManager;
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
                Clients.All.SendModPacks(_factorioModManager.GetModPacks());
            }

            return Task.FromResult(result);
        }

        public Task<Result> DeleteModPack(string name)
        {
            var result = _factorioModManager.DeleteModPack(name);

            if (result.Success)
            {
                Clients.All.SendModPacks(_factorioModManager.GetModPacks());
            }

            return Task.FromResult(result);
        }

        public Task<Result> RenameModPack(string name, string newName)
        {
            var result = _factorioModManager.RenameModPack(name, newName);

            if (result.Success)
            {
                Clients.All.SendModPacks(_factorioModManager.GetModPacks());
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

            if (result.Success)
            {
                Clients.All.SendModPackFiles(modPack, _factorioModManager.GetModPackFiles(modPack));
            }

            return Task.FromResult(result);
        }
    }
}
