using System.Collections.Generic;
using System.Threading.Tasks;

namespace FactorioWebInterface.Models
{
    public enum MessageType
    {
        Output,
        Wrapper,
        Control,
        Status,
        Discord
    }

    public class MessageData
    {
        public string ServerId { get; set; }
        public MessageType MessageType { get; set; }
        public string Message { get; set; }
    }

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
        Task<FileMetaData[]> GetTempSaveFiles();
        Task<FileMetaData[]> GetLocalSaveFiles();
        Task<FileMetaData[]> GetGlobalSaveFiles();
        Task<ScenarioMetaData[]> GetScenarios();
        Task<List<FileMetaData>> GetLogFiles();
        Task<List<FileMetaData>> GetChatLogFiles();
        Task<Result> DeleteFiles(List<string> files);
        Task<Result> MoveFiles(string destination, List<string> filePaths);
        Task<Result> CopyFiles(string destination, List<string> filePaths);
        Task<Result> RenameFile(string directoryPath, string fileName, string newFileName);
        Task<FactorioServerSettingsWebEditable> GetServerSettings();
        Task<Result> SaveServerSettings(FactorioServerSettingsWebEditable settings);
        Task<FactorioServerExtraSettings> GetServerExtraSettings();
        Task<Result> SaveServerExtraSettings(FactorioServerExtraSettings settings);
        Task<Result> DeflateSave(string directoryPath, string fileName, string newFileName);
        Task RequestGetDownloadableVersions();
        Task<string> GetVersion();
        Task<ModPackMetaData[]> GetModPacks();
        Task<string> GetModPack();
        Task SetModPack(string modPack);
    }

    public interface IFactorioControlClientMethods
    {
        //Task FactorioOutputData(string data);
        //Task FactorioWrapperOutputData(string data);
        //Task FactorioWebInterfaceData(string data);
        Task SendMessage(MessageData message);
        Task FactorioStatusChanged(string newStatus, string oldStatus);
        Task SendTempSavesFiles(FileMetaData[] files);
        Task SendLocalSaveFiles(FileMetaData[] files);
        Task SendGlobalSaveFiles(FileMetaData[] files);
        Task DeflateFinished(Result result);
        Task SendDownloadableVersions(List<string> versions);
        Task SendCachedVersions(List<string> versions);
        Task SendVersion(string version);
        Task SendModPacks(ModPackMetaData[] modPacks);
        Task SendSelectedModPack(string modPack);
    }
}
