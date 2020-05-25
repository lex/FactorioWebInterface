using FactorioWebInterface.Utils;
using Serilog;
using Serilog.Core;
using Shared;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FactorioWebInterface.Models
{
    public class FactorioServerMutableData
    {
        public FactorioServerConstantData Constants { get; }
        public string ServerId => Constants.ServerId;
        public string BaseDirectoryPath => Constants.BaseDirectoryPath;
        public string TempSavesDirectoryPath => Constants.TempSavesDirectoryPath;
        public string LocalSavesDirectoroyPath => Constants.LocalSavesDirectoroyPath;
        public string LocalScenarioDirectoryPath => Constants.LocalScenarioDirectoryPath;
        public string LogsDirectoryPath => Constants.LogsDirectoryPath;
        public string ArchiveLogsDirectoryPath => Constants.ArchiveLogsDirectoryPath;
        public string CurrentLogPath => Constants.CurrentLogPath;
        public string ExecutablePath => Constants.ExecutablePath;
        public string ServerSettingsPath => Constants.ServerSettingsPath;
        public string ServerExtraSettingsPath => Constants.ServerExtraSettingsPath;
        public string ServerBanListPath => Constants.ServerBanListPath;
        public string ServerAdminListPath => Constants.ServerAdminListPath;
        public string Port => Constants.Port;
        public string ChatLogsDirectoryPath => Constants.ChatLogsDirectoryPath;
        public string ChatLogsArchiveDirectoryPath => Constants.ChatLogsArchiveDirectoryPath;
        public string ChatLogCurrentPath => Constants.ChatLogCurrentPath;

        public FactorioServerStatus Status { get; set; }
        public string Version { get; set; } = "";
        public CircularBuffer<MessageData> ControlMessageBuffer { get; set; }
        public FactorioServerSettings? ServerSettings { get; set; }
        public string[]? ServerAdminList { get; set; }
        public FactorioServerSettingsWebEditable? ServerWebEditableSettings { get; set; }
        public bool ServerSettingsSaved { get; set; } = true;
        public FactorioServerExtraSettings ServerExtraSettings { get; set; }
        public FactorioServerExtraSettings? ServerExtraWebEditableSettings { get; set; }
        public bool ServerExtraSettingsSaved { get; set; } = true;
        public Logger? ChatLogger { get; set; }
        public string ModPack { get; set; } = "";
        public DateTime LastTempFilesChecked { get; set; } = default;
        public SortedList<string, int> OnlinePlayers { get; set; }
        public int OnlinePlayerCount { get; set; }
        public DateTime StartTime { get; set; }

        public Func<FactorioServerMutableData, Task>? StopCallback { get; set; }
        public HashSet<string> TrackingDataSets { get; set; } = new HashSet<string>();

        public FactorioServerMutableData(FactorioServerConstantData factorioServerConstantData, int bufferSize)
        {
            Constants = factorioServerConstantData;
            Status = FactorioServerStatus.Unknown;
            ControlMessageBuffer = new CircularBuffer<MessageData>(bufferSize);
            OnlinePlayers = new SortedList<string, int>();
            OnlinePlayerCount = 0;
            ServerExtraSettings = FactorioServerExtraSettings.MakeDefault();
        }

        public static Logger BuildChatLogger(string chatLogCurrentPath)
        {
            return new LoggerConfiguration()
                .MinimumLevel.Information()
                .WriteTo.Async(a => a.File(chatLogCurrentPath, outputTemplate: "{Message:l}{NewLine}"))
                .CreateLogger();
        }
    }
}
