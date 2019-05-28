using FactorioWebInterface.Hubs;
using FactorioWebInterface.Models;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FactorioWebInterface.Services
{
    public class BanHubEventHandlerService
    {
        private readonly FactorioBanManager _factorioBanManager;
        private readonly IHubContext<FactorioBanHub, IFactorioBanClientMethods> _banHub;
        public BanHubEventHandlerService(FactorioBanManager factorioBanManager, IHubContext<FactorioBanHub, IFactorioBanClientMethods> banHub)
        {
            _factorioBanManager = factorioBanManager;
            _banHub = banHub;

            _factorioBanManager.BanChanged += FactorioBanManager_BanChanged;
        }

        private void FactorioBanManager_BanChanged(FactorioBanManager sender, FactorioBanEventArgs eventArgs)
        {
            _ = _banHub.Clients.All.SendBans(eventArgs.ChangeData);
        }
    }
}
