using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FactorioWebInterface.Utils;
using Serilog.Core;
using Shared;

namespace FactorioWebInterface.Models
{
    public class FactorioServerData : ThreadSafeWrapper<FactorioServerMutableData>
    {
        public static FactorioServerData New(int serverNumber, string baseDirectoryPath, int bufferSize)
        {
            var constantData = new FactorioServerConstantData(serverNumber, baseDirectoryPath);
            var mutableData = new FactorioServerMutableData(constantData, bufferSize);
            return new FactorioServerData(mutableData);
        }

        private readonly FactorioServerMutableData mutableData;

        public FactorioServerConstantData Constants { get; }

        public string ServerId => Constants.ServerId;
        public FactorioServerStatus Status => mutableData.Status;
        public string Version => mutableData.Version;
        public string? RunningName => mutableData.ServerRunningSettings?.Name;
        public DateTime StartTime => mutableData.StartTime;
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
        public Logger? ChatLogger => mutableData.ChatLogger;

        public FactorioServerData(FactorioServerMutableData factorioServerMutableData) : base(factorioServerMutableData)
        {
            Constants = factorioServerMutableData.Constants;
            mutableData = factorioServerMutableData;
        }
    }
}
