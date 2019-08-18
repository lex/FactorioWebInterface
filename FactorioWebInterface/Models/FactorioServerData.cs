using DSharpPlus;
using FactorioWebInterface.Hubs;
using Newtonsoft.Json;
using Serilog;
using Serilog.Core;
using Shared;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace FactorioWebInterface.Models
{
    public class FactorioServerData
    {
        public static readonly string baseDirectoryPath = Path.GetFullPath("/factorio/");
        public static readonly string basePublicDirectoryPath = Path.GetFullPath("/factorio/public/");

        public static readonly int serverCount = 10;
        public static readonly int bufferSize = 200;
        public static readonly int maxLogFiles = 10;

        public static string GlobalSavesDirectoryPath { get; } = Path.GetFullPath(Path.Combine(baseDirectoryPath, Constants.GlobalSavesDirectoryName));
        public static string ScenarioDirectoryPath { get; } = Path.GetFullPath(Path.Combine(baseDirectoryPath, Constants.ScenarioDirectoryName));
        public static string UpdateCacheDirectoryPath { get; } = Path.GetFullPath(Path.Combine(baseDirectoryPath, Constants.UpdateCacheDirectoryName));
        public static string ModsDirectoryPath { get; } = Path.GetFullPath(Path.Combine(baseDirectoryPath, Constants.ModsDirectoryName));

        public static HashSet<string> ValidSaveDirectories { get; } = new HashSet<string>();

        public string ServerId { get; set; }
        public FactorioServerStatus Status { get; set; }
        public string Version { get; set; }
        public string BaseDirectoryPath { get; set; }
        public string TempSavesDirectoryPath { get; set; }
        public string LocalSavesDirectoroyPath { get; set; }
        public string LocalScenarioDirectoryPath { get; set; }
        public string LogsDirectoryPath { get; set; }
        public string ArchiveLogsDirectoryPath { get; set; }
        public string CurrentLogPath { get; set; }
        public string ExecutablePath { get; set; }
        public string ServerSettingsPath { get; set; }
        public string ServerExtraSettingsPath { get; set; }
        public string ServerBanListPath { get; set; }
        public string ServerAdminListPath { get; set; }
        public string Port { get; set; }
        public bool IsRemote { get; set; }
        public string SshIdentity { get; set; }
        public SemaphoreSlim ServerLock { get; set; }
        public RingBuffer<MessageData> ControlMessageBuffer { get; set; }
        public FactorioServerSettings ServerSettings { get; set; }
        public string[] ServerAdminList { get; set; }
        public FactorioServerSettingsWebEditable ServerWebEditableSettings { get; set; }
        public bool ServerSettingsSaved { get; set; } = true;
        public FactorioServerExtraSettings ServerExtraSettings { get; set; }
        public FactorioServerExtraSettings ServerExtraWebEditableSettings { get; set; }
        public bool ServerExtraSettingsSaved { get; set; } = true;
        public string ChatLogsDirectoryPath { get; set; }
        public string ChatLogsArchiveDirectoryPath { get; set; }
        public string ChatLogCurrentPath { get; set; }
        public Logger ChatLogger { get; set; }
        public string ModPack { get; set; } = "";
        public DateTime LastTempFilesChecked = default;

        public SortedList<string, int> OnlinePlayers { get; set; }
        public int OnlinePlayerCount { get; set; }

        public Func<Task> StopCallback { get; set; }
        public HashSet<string> TrackingDataSets { get; set; } = new HashSet<string>();

        public static Dictionary<string, FactorioServerData> Servers { get; }

        static FactorioServerData()
        {
            ValidSaveDirectories.Add(Constants.GlobalSavesDirectoryName);
            ValidSaveDirectories.Add(Constants.PublicStartSavesDirectoryName);
            ValidSaveDirectories.Add(Constants.PublicFinalSavesDirectoryName);
            ValidSaveDirectories.Add(Constants.PublicOldSavesDirectoryName);
            ValidSaveDirectories.Add(Constants.WindowsPublicStartSavesDirectoryName);
            ValidSaveDirectories.Add(Constants.WindowsPublicFinalSavesDirectoryName);
            ValidSaveDirectories.Add(Constants.WindowsPublicOldSavesDirectoryName);

            Servers = new Dictionary<string, FactorioServerData>();

            for (int i = 1; i <= serverCount; i++)
            {
                string port = (34200 + i).ToString();
                string serverId = i.ToString();

                string basePath = Path.Combine(baseDirectoryPath, serverId);
                var serverData = new FactorioServerData()
                {
                    ServerId = serverId,
                    Status = FactorioServerStatus.Unknown,
                    BaseDirectoryPath = basePath,
                    TempSavesDirectoryPath = Path.Combine(basePath, Constants.TempSavesDirectoryName),
                    LocalSavesDirectoroyPath = Path.Combine(basePath, Constants.LocalSavesDirectoryName),
                    ServerSettingsPath = Path.Combine(basePath, Constants.ServerSettingsFileName),
                    ServerExtraSettingsPath = Path.Combine(basePath, Constants.ServerExtraSettingsFileName),
                    LocalScenarioDirectoryPath = Path.Combine(basePath, Constants.ScenarioDirectoryName),

                    LogsDirectoryPath = Path.Combine(basePath, Constants.LogDirectoryName),
                    ArchiveLogsDirectoryPath = Path.Combine(basePath, Constants.LogDirectoryName, Constants.ArchiveDirectoryName),
                    CurrentLogPath = Path.Combine(basePath, Constants.CurrentLogFileName),
                    ChatLogsDirectoryPath = Path.Combine(basePath, Constants.ChatLogDirectoryName),
                    ChatLogsArchiveDirectoryPath = Path.Combine(basePath, Constants.ChatLogDirectoryName, Constants.ArchiveDirectoryName),
                    ChatLogCurrentPath = Path.Combine(basePath, Constants.ChatLogDirectoryName, Constants.CurrentChatLogName),

                    ExecutablePath = Path.GetFullPath(Path.Combine(basePath, Constants.ExecutablePath)),

                    ServerBanListPath = Path.Combine(basePath, Constants.ServerBanListFileName),
                    ServerAdminListPath = Path.Combine(basePath, Constants.ServerAdminListFileName),
                    Port = port,
                    ServerLock = new SemaphoreSlim(1, 1),
                    ControlMessageBuffer = new RingBuffer<MessageData>(bufferSize),
                    IsRemote = false,
                    ServerExtraSettings = FactorioServerExtraSettings.MakeDefault(),
                    OnlinePlayers = new SortedList<string, int>(),
                    OnlinePlayerCount = 0
                };
                Servers[serverId] = serverData;

                try
                {
                    var fi = new FileInfo(serverData.ServerExtraSettingsPath);
                    if (fi.Exists)
                    {
                        var data = File.ReadAllText(fi.FullName);
                        var extraSettings = JsonConvert.DeserializeObject<FactorioServerExtraSettings>(data);
                        if (extraSettings == null)
                        {
                            continue;
                        }
                        serverData.ServerExtraSettings = extraSettings;
                    }
                }
                catch (Exception)
                {
                }

                serverData.Version = FactorioVersionFinder.GetVersionString(serverData.ExecutablePath);

                ValidSaveDirectories.Add($"{serverId}/{Constants.TempSavesDirectoryName}");
                ValidSaveDirectories.Add($"{serverId}/{Constants.LocalSavesDirectoryName}");
                ValidSaveDirectories.Add($"{serverId}\\{Constants.TempSavesDirectoryName}");
                ValidSaveDirectories.Add($"{serverId}\\{Constants.LocalSavesDirectoryName}");
            }

            //Servers["7"].IsRemote = true;
            //Servers["7"].SshIdentity = "usvserver";
        }

        public void BuildChatLogger()
        {
            ChatLogger = new LoggerConfiguration()
                .MinimumLevel.Information()
                .WriteTo.Async(a => a.File(ChatLogCurrentPath, outputTemplate: "{Message:l}{NewLine}"))
                .CreateLogger();
        }
    }
}
