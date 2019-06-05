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
        private readonly IFactorioBanService _factorioBanManager;
        private readonly IHubContext<FactorioBanHub, IFactorioBanClientMethods> _banHub;
        public BanHubEventHandlerService(IFactorioBanService factorioBanManager, IHubContext<FactorioBanHub, IFactorioBanClientMethods> banHub)
        {
            _factorioBanManager = factorioBanManager;
            _banHub = banHub;

            _factorioBanManager.BanChanged += FactorioBanManager_BanChanged;
        }

        private void FactorioBanManager_BanChanged(IFactorioBanService sender, FactorioBanEventArgs eventArgs)
        {
            _ = _banHub.Clients.All.SendBans(eventArgs.ChangeData);
        }
    }
}
