using FactorioWebInterface.Data;
using FactorioWebInterface.Models;
using FactorioWebInterface.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace FactorioWebInterface.Hubs
{
    [Authorize]
    public class FactorioBanHub : Hub<IFactorioBanClientMethods>
    {
        private readonly IFactorioBanService _factorioBanManager;

        public FactorioBanHub(IFactorioBanService factorioBanManager)
        {
            _factorioBanManager = factorioBanManager;
        }

        public Task RequestAllBans()
        {
            var client = Clients.Client(Context.ConnectionId);

            _ = Task.Run(async () =>
            {
                var bans = await _factorioBanManager.GetBansAsync();
                var data = CollectionChangedData.Reset(bans);

                await client.SendBans(data);
            });

            return Task.CompletedTask;
        }

        public Task<Result> AddBan(Ban ban, bool synchronizeWithServers)
        {
            string? actor = Context.User?.Identity?.Name;
            return _factorioBanManager.AddBanFromWeb(ban, synchronizeWithServers, actor);
        }

        public Task<Result> RemoveBan(string username, bool synchronizeWithServers)
        {
            string? actor = Context.User?.Identity?.Name;
            return _factorioBanManager.RemoveBanFromWeb(username, synchronizeWithServers, actor);
        }
    }
}
