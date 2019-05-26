using FactorioWebInterface.Hubs;
using FactorioWebInterface.Models;
using Shared;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FactorioWebInterface.Services
{
    public interface IFactorioServerManager
    {
        bool IsValidServerId(string serverId);
        Task<Result> Resume(string serverId, string userName);
        Task<Result> Load(string serverId, string directoryName, string fileName, string userName);
        Task<Result> StartScenario(string serverId, string scenarioName, string userName);
        Task<Result> Stop(string serverId, string userName);
        Task<Result> ForceStop(string serverId, string userName);
        Task<FactorioServerStatus> GetStatus(string serverId);
        Task RequestStatus(string serverId);
        Task<MessageData[]> GetFactorioControlMessagesAsync(string serverId);
        Task SendToFactorioProcess(string serverId, string data);
        Task FactorioDataReceived(string serverId, string data, DateTime dateTime);
        Task FactorioControlDataReceived(string serverId, string data, string userName);
        void FactorioWrapperDataReceived(string serverId, string data, DateTime dateTime);
        Task OnProcessRegistered(string serverId);
        Task StatusChanged(string serverId, FactorioServerStatus newStatus, FactorioServerStatus oldStatus, DateTime dateTime);
        FileMetaData[] GetTempSaveFiles(string serverId);
        FileMetaData[] GetLocalSaveFiles(string serverId);
        FileMetaData[] GetGlobalSaveFiles();
        ScenarioMetaData[] GetScenarios();
        List<FileMetaData> GetLogs(string serverId);
        List<FileMetaData> GetChatLogs(string serverId);
        Task<(FactorioServerSettingsWebEditable settings, bool saved)> GetEditableServerSettings(string serverId);
        Task<Result> SaveEditableServerSettings(string serverId, FactorioServerSettingsWebEditable settings);
        Task<(FactorioServerExtraSettings settings, bool saved)> GetEditableServerExtraSettings(string serverId);
        Task<Result> SaveEditableExtraServerSettings(string serverId, FactorioServerExtraSettings settings);
        Task UpdateServerSettings(KeyValueCollectionChangedData<string, object> data, string serverId, string connectionId);
        Task UpdateServerExtraSettings(KeyValueCollectionChangedData<string, object> data, string serverId, string connectionId);
        Task UndoServerSettings(string serverId);
        Task UndoServerExtraSettings(string serverId);
        Task<Result> Install(string id, string userName, string version);
        Task<Result> Save(string id, string userName, string saveName);
        Result DeflateSave(string connectionId, string serverId, string directoryPath, string fileName, string newFileName);
        Task<List<string>> GetDownloadableVersions();
        Task<string[]> GetCachedVersions();
        bool DeleteCachedVersion(string version);
        string GetVersion(string serverId);
        Task<string> GetSelectedModPack(string serverId);
        Task SetSelectedModPack(string serverId, string modPack);
    }
}