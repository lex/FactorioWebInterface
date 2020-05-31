using FactorioWebInterface.Services;
using FactorioWebInterface.Utils;
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
            if (Context.TryGetData(out string? serverId) && serverId != null)
            {
                Groups.RemoveFromGroupAsync(connectionId, serverId);
            }
            return base.OnDisconnectedAsync(exception);
        }

        public async Task RegisterServerIdWithDateTime(string serverId, DateTime dateTime)
        {
            string connectionId = Context.ConnectionId;
            Context.SetData(serverId);

            await Groups.AddToGroupAsync(connectionId, serverId);

            await _factorioServerManger.OnProcessRegistered(serverId);
        }

        public Task SendFactorioOutputDataWithDateTime(string data, DateTime dateTime)
        {
            if (Context.TryGetData(out string? serverId) && serverId != null)
            {
                _factorioServerManger.FactorioDataReceived(serverId, data, dateTime);
            }

            return Task.CompletedTask;
        }

        public Task SendWrapperDataWithDateTime(string data, DateTime dateTime)
        {
            if (Context.TryGetData(out string? serverId) && serverId != null)
            {
                _factorioServerManger.FactorioWrapperDataReceived(serverId, data, dateTime);
            }

            return Task.CompletedTask;
        }

        public Task StatusChangedWithDateTime(FactorioServerStatus newStatus, FactorioServerStatus oldStatus, DateTime dateTime)
        {
            if (Context.TryGetData(out string? serverId) && serverId != null)
            {
                _ = _factorioServerManger.StatusChanged(serverId, newStatus, oldStatus, dateTime);
            }

            return Task.CompletedTask;
        }
    }
}

