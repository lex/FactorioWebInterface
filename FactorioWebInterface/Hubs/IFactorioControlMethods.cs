using FactorioWebInterface.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FactorioWebInterface.Hubs
{
    public class FactorioContorlClientData
    {
        public string Status { get; set; }
        public MessageData[] Messages { get; set; }
    }

    public interface IFactorioControlServerMethods
    {
        Task<FactorioContorlClientData> SetServerId(string serverId);
        Task<Result> Resume();
        Task<Result> Load(string directoryName, string fileName);
        Task<Result> StartScenario(string scenarioName);
        Task<Result> Stop();
        Task<Result> ForceStop();
        Task GetStatus();
        Task<MessageData[]> GetMesssages();
        Task SendToFactorio(string data);
        Task RequestTempSaveFiles();
        Task RequestLocalSaveFiles();
        Task RequestGlobalSaveFiles();
        Task RequestScenarios();
        Task RequestModPacks();
        Task RequestLogFiles();
        Task RequestChatLogFiles();
        Task<Result> DeleteFiles(List<string> files);
        Task<Result> MoveFiles(string destination, List<string> filePaths);
        Task<Result> CopyFiles(string destination, List<string> filePaths);
        Task<Result> RenameFile(string directoryPath, string fileName, string newFileName);
        Task<FactorioServerSettingsWebEditable> GetServerSettings();
        Task<Result> SaveServerSettings(FactorioServerSettingsWebEditable settings);
        Task<FactorioServerExtraSettings> GetServerExtraSettings();
        Task<Result> SaveServerExtraSettings(FactorioServerExtraSettings settings);
        Task<Result> DeflateSave(string directoryPath, string fileName, string newFileName);
        Task RequestDownloadableVersions();
        Task RequestCachedVersions();
        Task<string> GetVersion();
        Task RequestSelectedModPack();
        Task SetSelectedModPack(string modPack);
    }

    public interface IFactorioControlClientMethods
    {
        //Task FactorioOutputData(string data);
        //Task FactorioWrapperOutputData(string data);
        //Task FactorioWebInterfaceData(string data);
        Task SendMessage(MessageData message);
        Task FactorioStatusChanged(string newStatus, string oldStatus);
        Task SendTempSavesFiles(string serverId, TableData<FileMetaData> data);
        Task SendLocalSaveFiles(string serverId, TableData<FileMetaData> data);
        Task SendGlobalSaveFiles(TableData<FileMetaData> data);
        Task SendScenarios(TableData<ScenarioMetaData> data);
        Task SendModPacks(TableData<ModPackMetaData> data);
        Task SendLogFiles(string serverId, TableData<FileMetaData> data);
        Task SendChatLogFiles(string serverId, TableData<FileMetaData> data);
        Task DeflateFinished(Result result);
        Task SendDownloadableVersions(List<string> versions);
        Task SendCachedVersions(TableData<string> data);
        Task SendVersion(string version);
        Task SendSelectedModPack(string modPack);
    }
}
