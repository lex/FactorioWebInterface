using System.IO;

namespace FactorioWebInterface.Models
{
    public class FactorioServerConstantData
    {
        public string ServerId { get; }
        public string BaseDirectoryPath { get; }
        public string TempSavesDirectoryPath { get; }
        public string LocalSavesDirectoroyPath { get; }
        public string LocalScenarioDirectoryPath { get; }
        public string LogsDirectoryPath { get; }
        public string ArchiveLogsDirectoryPath { get; }
        public string CurrentLogPath { get; }
        public string ExecutablePath { get; }
        public string ServerSettingsPath { get; }
        public string ServerRunningSettingsPath { get; }
        public string ServerExtraSettingsPath { get; }
        public string ServerBanListPath { get; }
        public string ServerAdminListPath { get; }
        public string Port { get; }
        public string ChatLogsDirectoryPath { get; }
        public string ChatLogsArchiveDirectoryPath { get; }
        public string ChatLogCurrentPath { get; }

        public FactorioServerConstantData(int serverNumber, string baseFactorioDirectoryPath)
        {
            string port = (34200 + serverNumber).ToString();
            string serverId = serverNumber.ToString();

            string basePath = Path.Combine(baseFactorioDirectoryPath, serverId);

            ServerId = serverId;
            BaseDirectoryPath = basePath;
            TempSavesDirectoryPath = Path.Combine(basePath, Constants.TempSavesDirectoryName);
            LocalSavesDirectoroyPath = Path.Combine(basePath, Constants.LocalSavesDirectoryName);
            ServerSettingsPath = Path.Combine(basePath, Constants.ServerSettingsFileName);
            ServerRunningSettingsPath = Path.Combine(basePath, Constants.ServerRunningSettingsFileName);
            ServerExtraSettingsPath = Path.Combine(basePath, Constants.ServerExtraSettingsFileName);
            LocalScenarioDirectoryPath = Path.Combine(basePath, Constants.ScenarioDirectoryName);

            LogsDirectoryPath = Path.Combine(basePath, Constants.LogDirectoryName);
            ArchiveLogsDirectoryPath = Path.Combine(basePath, Constants.LogDirectoryName, Constants.ArchiveDirectoryName);
            CurrentLogPath = Path.Combine(basePath, Constants.CurrentLogFileName);
            ChatLogsDirectoryPath = Path.Combine(basePath, Constants.ChatLogDirectoryName);
            ChatLogsArchiveDirectoryPath = Path.Combine(basePath, Constants.ChatLogDirectoryName, Constants.ArchiveDirectoryName);
            ChatLogCurrentPath = Path.Combine(basePath, Constants.ChatLogDirectoryName, Constants.CurrentChatLogName);

            ExecutablePath = Path.GetFullPath(Path.Combine(basePath, Constants.ExecutablePath));

            ServerBanListPath = Path.Combine(basePath, Constants.ServerBanListFileName);
            ServerAdminListPath = Path.Combine(basePath, Constants.ServerAdminListFileName);
            Port = port;
        }
    }
}
