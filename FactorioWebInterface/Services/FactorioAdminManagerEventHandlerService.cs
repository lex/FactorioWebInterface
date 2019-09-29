using FactorioWebInterface.Data;
using FactorioWebInterface.Hubs;
using FactorioWebInterface.Models;
using Microsoft.AspNetCore.SignalR;

namespace FactorioWebInterface.Services
{
    public class FactorioAdminManagerEventHandlerService
    {
        private readonly IFactorioAdminManager _adminManager;
        private readonly IHubContext<FactorioAdminHub, IFactorioAdminClientMethods> _adminHub;
        private readonly IHubContext<FactorioControlHub, IFactorioControlClientMethods> _factorioControlHub;

        public FactorioAdminManagerEventHandlerService(IFactorioAdminManager adminManager, IHubContext<FactorioAdminHub, IFactorioAdminClientMethods> adminHub, IHubContext<FactorioControlHub, IFactorioControlClientMethods> factorioControlHub)
        {
            _adminManager = adminManager;
            _adminHub = adminHub;
            _factorioControlHub = factorioControlHub;

            _adminManager.AdminsChanged += FactorioAdminManager_AdminsChanged;
            adminManager.AdminListChanged += AdminManager_AdminListChanged;
        }

        private void FactorioAdminManager_AdminsChanged(IFactorioAdminManager sender, CollectionChangedData<Admin> eventArgs)
        {
            _adminHub.Clients.All.SendAdmins(eventArgs);
        }

        private void AdminManager_AdminListChanged(IFactorioAdminManager sender, FactorioAdminListChangedEventArgs eventArgs)
        {
            _factorioControlHub.Clients.Group(eventArgs.ServerId).SendServerSettingsUpdate(eventArgs.ChangedData, false);
        }
    }
}
