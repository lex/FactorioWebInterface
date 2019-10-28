using FactorioWebInterface.Hubs;
using FactorioWebInterface.Models;
using Microsoft.AspNetCore.SignalR;
using Shared;
using System;
using System.Collections.Generic;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using Xunit;
using Xunit.Sdk;

namespace FactorioWebInterfaceTests.Utils
{
    public class TestFactorioControlHub : IHubContext<FactorioControlHub, IFactorioControlClientMethods>
    {
        public static void AssertSendMessage(string serverId, MessageType messageType, string message, MethodInvokeData data)
        {
            Assert.Equal(nameof(IFactorioControlClientMethods.SendMessage), data.Name);

            var messageData = (MessageData)data.Arguments[0];
            Assert.Equal(serverId, messageData.ServerId);
            Assert.Equal(messageType, messageData.MessageType);
            Assert.Equal(message, messageData.Message);
        }

        public void AssertContainsMessage(string serverId, MessageType messageType, string message)
        {
            foreach (var invocation in Invocations)
            {
                var arguments = invocation.Arguments;
                if (invocation.Name == nameof(IFactorioControlClientMethods.SendMessage) && arguments.Length == 1
                    && arguments[0] is MessageData messageData
                    && serverId == messageData.ServerId
                    && messageType == messageData.MessageType
                    && message == messageData.Message)
                {
                    return;
                }
            }

            throw new ContainsInvocationException($"Message with {nameof(MessageData.ServerId)}: {serverId} and {nameof(MessageData.MessageType)}: {messageType} and {nameof(MessageData.Message)}: {message} not found.");
        }

        public void AssertContainsStatusMessage(string serverId, FactorioServerStatus oldStatus, FactorioServerStatus newStatus, string byUser = "")
        {
            string message;
            if (string.IsNullOrWhiteSpace(byUser))
            {
                message = $"[STATUS] Change from {oldStatus} to {newStatus}";
            }
            else
            {
                message = $"[STATUS] Change from {oldStatus} to {newStatus} by user {byUser}";
            }

            AssertContainsMessage(serverId, MessageType.Status, message);
        }

        public void AssertContainsChangeStatus(FactorioServerStatus oldStatus, FactorioServerStatus newStatus)
        {
            string oldStatusString = oldStatus.ToString();
            string newStatusString = newStatus.ToString();

            foreach (var invocation in Invocations)
            {
                var arguments = invocation.Arguments;
                if (invocation.Name == nameof(IFactorioControlClientMethods.FactorioStatusChanged) && arguments.Length == 2
                    && arguments[0].ToString() == oldStatusString
                    && arguments[1].ToString() == newStatusString)
                {
                    return;
                }

                throw new ContainsInvocationException($"Change Status with {nameof(oldStatus)}: {oldStatusString} and {nameof(newStatus)}: {newStatusString} not found.");
            }
        }

        private TestFactorioControlClients factorioControlClients = new TestFactorioControlClients();
        public IReadOnlyList<MethodInvokeData> Invocations => factorioControlClients.Invocations;

        public IHubClients<IFactorioControlClientMethods> Clients => factorioControlClients;
        public IGroupManager Groups { get; }
    }

    public class TestFactorioControlClients : IHubClients<IFactorioControlClientMethods>
    {
        private TestFactorioControlClientMethods clientMethods = new TestFactorioControlClientMethods();
        public IReadOnlyList<MethodInvokeData> Invocations => clientMethods.Invocations;

        public IFactorioControlClientMethods All => clientMethods;
        public IFactorioControlClientMethods AllExcept(IReadOnlyList<string> excludedConnectionIds) => clientMethods;
        public IFactorioControlClientMethods Client(string connectionId) => clientMethods;
        public IFactorioControlClientMethods Clients(IReadOnlyList<string> connectionIds) => clientMethods;
        public IFactorioControlClientMethods Group(string groupName) => clientMethods;
        public IFactorioControlClientMethods GroupExcept(string groupName, IReadOnlyList<string> excludedConnectionIds) => clientMethods;
        public IFactorioControlClientMethods Groups(IReadOnlyList<string> groupNames) => clientMethods;
        public IFactorioControlClientMethods User(string userId) => clientMethods;
        public IFactorioControlClientMethods Users(IReadOnlyList<string> userIds) => clientMethods;
    }

    public class TestFactorioControlClientMethods : IFactorioControlClientMethods
    {
        private List<MethodInvokeData> invocations = new List<MethodInvokeData>();
        public IReadOnlyList<MethodInvokeData> Invocations => invocations;

        public Task DeflateFinished(Result result) => RecordInvoke(nameof(DeflateFinished), result);
        public Task FactorioStatusChanged(string newStatus, string oldStatus) => RecordInvoke(nameof(FactorioStatusChanged), newStatus, oldStatus);
        public Task SendCachedVersions(CollectionChangedData<string> data) => RecordInvoke(nameof(SendCachedVersions), data);
        public Task SendChatLogFiles(string serverId, CollectionChangedData<FileMetaData> data) => RecordInvoke(nameof(SendChatLogFiles), serverId, data);
        public Task SendDownloadableVersions(List<string> versions) => RecordInvoke(nameof(SendDownloadableVersions), versions);
        public Task SendGlobalSaveFiles(CollectionChangedData<FileMetaData> data) => RecordInvoke(nameof(SendGlobalSaveFiles), data);
        public Task SendLocalSaveFiles(string serverId, CollectionChangedData<FileMetaData> data) => RecordInvoke(nameof(SendLocalSaveFiles), serverId, data);
        public Task SendLogFiles(string serverId, CollectionChangedData<FileMetaData> data) => RecordInvoke(nameof(SendLogFiles), serverId, data);
        public Task SendMessage(MessageData message) => RecordInvoke(nameof(SendMessage), message);
        public Task SendModPacks(CollectionChangedData<ModPackMetaData> data) => RecordInvoke(nameof(SendModPacks), data);
        public Task SendScenarios(CollectionChangedData<ScenarioMetaData> data) => RecordInvoke(nameof(SendScenarios), data);
        public Task SendSelectedModPack(string modPack) => RecordInvoke(nameof(SendSelectedModPack), modPack);
        public Task SendServerExtraSettings(FactorioServerExtraSettings settings, bool isSaved) => RecordInvoke(nameof(SendServerExtraSettings), settings, isSaved);
        public Task SendServerExtraSettingsUpdate(KeyValueCollectionChangedData<string, object> data, bool markUnsaved) => RecordInvoke(nameof(SendServerExtraSettingsUpdate), data, markUnsaved);
        public Task SendServerSettings(FactorioServerSettingsWebEditable settings, bool isSaved) => RecordInvoke(nameof(SendServerSettings), settings, isSaved);
        public Task SendServerSettingsUpdate(KeyValueCollectionChangedData<string, object> data, bool markUnsaved) => RecordInvoke(nameof(SendServerSettingsUpdate), data, markUnsaved);
        public Task SendTempSavesFiles(string serverId, CollectionChangedData<FileMetaData> data) => RecordInvoke(nameof(SendTempSavesFiles), serverId, data);
        public Task SendVersion(string version) => RecordInvoke(nameof(SendVersion), version);

        private Task RecordInvoke([CallerMemberName] string name = "", params object[] arguments)
        {
            invocations.Add(new MethodInvokeData(name, arguments));
            return Task.CompletedTask;
        }
    }
}
