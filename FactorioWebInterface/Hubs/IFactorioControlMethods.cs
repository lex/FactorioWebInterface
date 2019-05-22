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
        Task UpdateServerSettings(KeyValueCollectionChangedData<string, object> data);
        Task UpdateServerExtraSettings(KeyValueCollectionChangedData<string, object> data);
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
        Task SendTempSavesFiles(string serverId, CollectionChangedData<FileMetaData> data);
        Task SendLocalSaveFiles(string serverId, CollectionChangedData<FileMetaData> data);
        Task SendGlobalSaveFiles(CollectionChangedData<FileMetaData> data);
        Task SendScenarios(CollectionChangedData<ScenarioMetaData> data);
        Task SendModPacks(CollectionChangedData<ModPackMetaData> data);
        Task SendLogFiles(string serverId, CollectionChangedData<FileMetaData> data);
        Task SendChatLogFiles(string serverId, CollectionChangedData<FileMetaData> data);
        Task DeflateFinished(Result result);
        Task SendDownloadableVersions(List<string> versions);
        Task SendCachedVersions(CollectionChangedData<string> data);
        Task SendVersion(string version);
        Task SendSelectedModPack(string modPack);
        Task SendServerSettings(FactorioServerSettingsWebEditable settings);
        Task SendServerSettingsUpdate(KeyValueCollectionChangedData<string, object> data);
        Task SendServerExtraSettings(FactorioServerExtraSettings settings);
        Task SendServerExtraSettingsUpdate(KeyValueCollectionChangedData<string, object> data);
    }
}
