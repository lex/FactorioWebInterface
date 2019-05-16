using FactorioWebInterface.Models;
using FactorioWebInterface.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Shared;
using System;
using System.Threading.Tasks;
using FactorioServerStatus = Shared.FactorioServerStatus;

namespace FactorioWebInterface.Hubs
{
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class FactorioProcessHub : Hub<IFactorioProcessClientMethods>, IFactorioProcessServerMethods
    {
        private readonly IFactorioServerManager _factorioServerManger;

        public FactorioProcessHub(IFactorioServerManager factorioServerManger)
        {
            _factorioServerManger = factorioServerManger;
        }

        public override Task OnDisconnectedAsync(Exception exception)
        {
            string connectionId = Context.ConnectionId;
            if (Context.Items.TryGetValue(connectionId, out object serverId))
            {
                string id = (string)serverId;
                Groups.RemoveFromGroupAsync(connectionId, id);
            }
            return base.OnDisconnectedAsync(exception);
        }

        public async Task RegisterServerIdWithDateTime(string serverId, DateTime dateTime)
        {
            string connectionId = Context.ConnectionId;
            Context.Items[connectionId] = serverId;

            await Groups.AddToGroupAsync(connectionId, serverId.ToString());

            await _factorioServerManger.OnProcessRegistered(serverId);
        }

        public Task SendFactorioOutputDataWithDateTime(string data, DateTime dateTime)
        {
            string connectionId = Context.ConnectionId;
            if (Context.Items.TryGetValue(connectionId, out object serverId))
            {
                string id = (string)serverId;
                _factorioServerManger.FactorioDataReceived(id, data, dateTime);
            }

            return Task.FromResult(0);
        }

        public Task SendWrapperDataWithDateTime(string data, DateTime dateTime)
        {
            string connectionId = Context.ConnectionId;
            if (Context.Items.TryGetValue(connectionId, out object serverId))
            {
                string id = (string)serverId;
                _factorioServerManger.FactorioWrapperDataReceived(id, data, dateTime);
            }

            return Task.FromResult(0);
        }

        public Task StatusChangedWithDateTime(FactorioServerStatus newStatus, FactorioServerStatus oldStatus, DateTime dateTime)
        {
            string connectionId = Context.ConnectionId;
            if (Context.Items.TryGetValue(connectionId, out object serverId))
            {
                string id = (string)serverId;
                return _factorioServerManger.StatusChanged(id, newStatus, oldStatus, dateTime);
            }

            return Task.FromResult(0);
        }
    }
}

