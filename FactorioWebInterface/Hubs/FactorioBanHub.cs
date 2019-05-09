using FactorioWebInterface.Data;
using FactorioWebInterface.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace FactorioWebInterface.Hubs
{
    [Authorize]
    public class FactorioBanHub : Hub<IFactorioBanClientMethods>
    {
        private readonly FactorioBanManager _factorioBanManager;

        public FactorioBanHub(FactorioBanManager factorioBanManager)
        {
            _factorioBanManager = factorioBanManager;
        }

        public Task RequestAllBans()
        {
            var client = Clients.Client(Context.ConnectionId);

            _ = Task.Run(async () =>
            {
                var bans = await _factorioBanManager.GetBansAsync();

                var tableData = new TableData<Ban>()
                {
                    Type = TableDataType.Reset,
                    Rows = bans
                };

                await client.SendBans(tableData);
            });

            return Task.CompletedTask;
        }

        public Task<Result> AddBan(Ban ban, bool synchronizeWithServers)
        {
            string actor = Context.User.Identity.Name;
            return _factorioBanManager.AddBanFromWeb(ban, synchronizeWithServers, actor);
        }

        public Task<Result> RemoveBan(string username, bool synchronizeWithServers)
        {
            string actor = Context.User.Identity.Name;
            return _factorioBanManager.RemoveBanFromWeb(username, synchronizeWithServers, actor);
        }
    }
}
