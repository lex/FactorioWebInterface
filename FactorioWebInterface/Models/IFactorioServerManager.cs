using FactorioWebInterface.Data;
using Microsoft.AspNetCore.Http;
using Shared;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;

namespace FactorioWebInterface.Models
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
        Task<List<Admin>> GetAdminsAsync();
        Task AddAdminsFromStringAsync(string data);
        Task RemoveAdmin(string name);
        FileMetaData[] GetLocalSaveFiles(string serverId);
        FileMetaData[] GetTempSaveFiles(string serverId);
        FileMetaData[] GetGlobalSaveFiles();
        ScenarioMetaData[] GetScenarios();
        List<FileMetaData> GetLogs(string serverId);
        List<FileMetaData> GetChatLogs(string serverId);
        FileInfo GetLogFile(string directoryName, string fileName);
        FileInfo GetChatLogFile(string directoryName, string fileName);
        FileInfo GetSaveFile(string directory, string fileName);
        Task<Result> UploadFiles(string directory, IList<IFormFile> files);
        Result DeleteFiles(List<string> filePaths);
        Result MoveFiles(string destination, List<string> filePaths);
        Task<Result> CopyFiles(string destination, List<string> filePaths);
        Result RenameFile(string directoryPath, string fileName, string newFileName);
        //Task ReloadServerSettings(string serverId);
        Task<FactorioServerSettingsWebEditable> GetEditableServerSettings(string serverId);
        Task<Result> SaveEditableServerSettings(string serverId, FactorioServerSettingsWebEditable settings);
        Task<FactorioServerExtraSettings> GetExtraServerSettings(string serverId);
        Task<Result> SaveExtraServerSettings(string serverId, FactorioServerExtraSettings settings);
        Task<Result> Install(string id, string userName, string version);
        Task<Result> Save(string id, string userName, string saveName);
        Result DeflateSave(string connectionId, string directoryPath, string fileName, string newFileName);
        Task<List<string>> GetDownloadableVersions();
        Task<List<string>> GetCachedVersions();
        bool DeleteCachedVersion(string version);
        string GetVersion(string serverId);
        Task<string> GetModPack(string serverId);
        Task SetModPack(string serverId, string modPack);
    }
}