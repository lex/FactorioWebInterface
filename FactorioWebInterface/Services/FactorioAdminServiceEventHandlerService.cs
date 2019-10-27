using FactorioWebInterface.Data;
using FactorioWebInterface.Hubs;
using FactorioWebInterface.Models;
using Microsoft.AspNetCore.SignalR;

namespace FactorioWebInterface.Services
{
    public class FactorioAdminServiceEventHandlerService
    {
        private readonly IFactorioAdminService _adminService;
        private readonly IHubContext<FactorioAdminHub, IFactorioAdminClientMethods> _adminHub;
        private readonly IHubContext<FactorioControlHub, IFactorioControlClientMethods> _factorioControlHub;

        public FactorioAdminServiceEventHandlerService(IFactorioAdminService adminService, IHubContext<FactorioAdminHub, IFactorioAdminClientMethods> adminHub, IHubContext<FactorioControlHub, IFactorioControlClientMethods> factorioControlHub)
        {
            _adminService = adminService;
            _adminHub = adminHub;
            _factorioControlHub = factorioControlHub;

            _adminService.AdminsChanged += AdminService_AdminsChanged;
            adminService.AdminListChanged += AdminService_AdminListChanged;
        }

        private void AdminService_AdminsChanged(IFactorioAdminService sender, CollectionChangedData<Admin> eventArgs)
        {
            _adminHub.Clients.All.SendAdmins(eventArgs);
        }

        private void AdminService_AdminListChanged(IFactorioAdminService sender, FactorioAdminListChangedEventArgs eventArgs)
        {
            _factorioControlHub.Clients.Group(eventArgs.ServerId).SendServerSettingsUpdate(eventArgs.ChangedData, false);
        }
    }
}
