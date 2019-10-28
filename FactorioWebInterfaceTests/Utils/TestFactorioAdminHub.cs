using FactorioWebInterface.Data;
using FactorioWebInterface.Hubs;
using FactorioWebInterface.Models;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Tasks;

namespace FactorioWebInterfaceTests.Utils
{
    public class TestFactorioAdminHub : IHubContext<FactorioAdminHub, IFactorioAdminClientMethods>
    {
        private TestFactorioAdminClients factorioAdminClients = new TestFactorioAdminClients();
        public IReadOnlyList<MethodInvokeData> Invocations => factorioAdminClients.Invocations;

        public IHubClients<IFactorioAdminClientMethods> Clients { get; }
        public IGroupManager Groups { get; }
    }

    public class TestFactorioAdminClients : IHubClients<IFactorioAdminClientMethods>
    {
        private TestFactorioAdminClientMethods clientMethods = new TestFactorioAdminClientMethods();
        public IReadOnlyList<MethodInvokeData> Invocations => clientMethods.Invocations;

        public IFactorioAdminClientMethods All => clientMethods;
        public IFactorioAdminClientMethods AllExcept(IReadOnlyList<string> excludedConnectionIds) => clientMethods;
        public IFactorioAdminClientMethods Client(string connectionId) => clientMethods;
        public IFactorioAdminClientMethods Clients(IReadOnlyList<string> connectionIds) => clientMethods;
        public IFactorioAdminClientMethods Group(string groupName) => clientMethods;
        public IFactorioAdminClientMethods GroupExcept(string groupName, IReadOnlyList<string> excludedConnectionIds) => clientMethods;
        public IFactorioAdminClientMethods Groups(IReadOnlyList<string> groupNames) => clientMethods;
        public IFactorioAdminClientMethods User(string userId) => clientMethods;
        public IFactorioAdminClientMethods Users(IReadOnlyList<string> userIds) => clientMethods;
    }

    public class TestFactorioAdminClientMethods : IFactorioAdminClientMethods
    {
        private List<MethodInvokeData> invocations = new List<MethodInvokeData>();
        public IReadOnlyList<MethodInvokeData> Invocations => invocations;

        public Task SendAdmins(CollectionChangedData<Admin> data) => RecordInvoke(nameof(SendAdmins), data);

        private Task RecordInvoke([CallerMemberName] string name = "", params object[] arguments)
        {
            invocations.Add(new MethodInvokeData(name, arguments));
            return Task.CompletedTask;
        }
    }
}
