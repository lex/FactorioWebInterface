using FactorioWebInterface.Data;
using FactorioWebInterface.Models;
using FactorioWebInterface.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace FactorioWebInterface.Hubs
{
    [Authorize]
    public class FactorioAdminHub : Hub<IFactorioAdminClientMethods>
    {
        private readonly FactorioAdminManager _factorioAdminManager;

        public FactorioAdminHub(FactorioAdminManager factorioAdminManager)
        {
            _factorioAdminManager = factorioAdminManager;
        }

        public Task RequestAdmins()
        {
            var client = Clients.Client(Context.ConnectionId);

            _ = Task.Run(async () =>
            {
                var admins = await _factorioAdminManager.GetAdmins();
                var data = CollectionChangedData.Reset(admins);

                _ = client.SendAdmins(data);
            });

            return Task.CompletedTask;
        }

        public async Task<Result> AddAdmins(string data)
        {
            return await _factorioAdminManager.AddAdmins(data);
        }

        public async Task<Result> RemoveAdmin(string name)
        {
            return await _factorioAdminManager.RemoveAdmin(name);
        }
    }
}
