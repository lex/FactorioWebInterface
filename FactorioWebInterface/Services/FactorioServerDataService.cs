using FactorioWebInterface.Models;
using Microsoft.Extensions.Logging;
using Microsoft.VisualStudio.Web.CodeGeneration;
using Newtonsoft.Json;
using Serilog;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace FactorioWebInterface.Services
{
    public interface IFactorioServerDataService
    {
        string BaseDirectoryPath { get; }
        string BasePublicDirectoryPath { get; }
        string GlobalSavesDirectoryPath { get; }
        string ScenarioDirectoryPath { get; }
        string UpdateCacheDirectoryPath { get; }
        string ModsDirectoryPath { get; }
        int ServerCount { get; }
        int BufferSize { get; }
        int MaxLogFiles { get; }
        string FactorioWrapperPath { get; }

        IReadOnlyDictionary<string, FactorioServerData> Servers { get; }

        bool TryGetServerData(string serverId, out FactorioServerData serverData);

        bool IsValidServerId(string serverId);

        bool IsValidSaveDirectory(string path);

        void Init();
    }

    public class FactorioServerDataService : IFactorioServerDataService
    {
        private readonly ILogger<FactorioServerDataService> _logger;

        private readonly Dictionary<string, FactorioServerData> servers = new Dictionary<string, FactorioServerData>();
        private readonly HashSet<string> validSaveDirectories = new HashSet<string>();

        public string BaseDirectoryPath { get; }
        public string BasePublicDirectoryPath { get; }
        public string GlobalSavesDirectoryPath { get; }
        public string ScenarioDirectoryPath { get; }
        public string UpdateCacheDirectoryPath { get; }
        public string ModsDirectoryPath { get; }
        public int ServerCount { get; }
        public int BufferSize { get; }
        public int MaxLogFiles { get; }
        public string FactorioWrapperPath { get; }

        public IReadOnlyDictionary<string, FactorioServerData> Servers { get; }

        public FactorioServerDataService(FactorioServerDataConfiguration factorioServerDataConfiguration, ILogger<FactorioServerDataService> logger)
        {
            _logger = logger;

            BaseDirectoryPath = Path.GetFullPath("/factorio/");
            BasePublicDirectoryPath = Path.GetFullPath(Path.Combine(BaseDirectoryPath, Constants.PublicDirectoryName));
            GlobalSavesDirectoryPath = Path.GetFullPath(Path.Combine(BaseDirectoryPath, Constants.GlobalSavesDirectoryName));
            ScenarioDirectoryPath = Path.GetFullPath(Path.Combine(BaseDirectoryPath, Constants.ScenarioDirectoryName));
            UpdateCacheDirectoryPath = Path.GetFullPath(Path.Combine(BaseDirectoryPath, Constants.UpdateCacheDirectoryName));
            ModsDirectoryPath = Path.GetFullPath(Path.Combine(BaseDirectoryPath, Constants.ModsDirectoryName));

            ServerCount = factorioServerDataConfiguration.ServerCount;
            BufferSize = factorioServerDataConfiguration.BufferSize;
            MaxLogFiles = factorioServerDataConfiguration.MaxLogFiles;

#if WINDOWS
            FactorioWrapperPath = "C:/Projects/FactorioWebInterface/FactorioWrapper/bin/Windows/netcoreapp2.2/FactorioWrapper.dll";
#elif WSL
            FactorioWrapperPath = "/mnt/c/Projects/FactorioWebInterface/FactorioWrapper/bin/Wsl/netcoreapp2.2/publish/FactorioWrapper.dll";
#else
            FactorioWrapperPath = $"/factorio/{factorioServerDataConfiguration.FactorioWrapperName}/FactorioWrapper.dll";
#endif

            validSaveDirectories.Add(Constants.GlobalSavesDirectoryName);
            validSaveDirectories.Add(Constants.PublicStartSavesDirectoryName);
            validSaveDirectories.Add(Constants.PublicFinalSavesDirectoryName);
            validSaveDirectories.Add(Constants.PublicOldSavesDirectoryName);
            validSaveDirectories.Add(Constants.WindowsPublicStartSavesDirectoryName);
            validSaveDirectories.Add(Constants.WindowsPublicFinalSavesDirectoryName);
            validSaveDirectories.Add(Constants.WindowsPublicOldSavesDirectoryName);

            for (int serverNumber = 0; serverNumber < factorioServerDataConfiguration.ServerCount; serverNumber++)
            {
                var serverData = FactorioServerData.New(serverNumber, BaseDirectoryPath, factorioServerDataConfiguration.BufferSize);
                string serverId = serverData.ServerId;

                validSaveDirectories.Add($"{serverId}/{Constants.TempSavesDirectoryName}");
                validSaveDirectories.Add($"{serverId}/{Constants.LocalSavesDirectoryName}");
                validSaveDirectories.Add($"{serverId}\\{Constants.TempSavesDirectoryName}");
                validSaveDirectories.Add($"{serverId}\\{Constants.LocalSavesDirectoryName}");

                servers.Add(serverId, serverData);
            }

            Servers = servers;
        }

        public void Init()
        {
            var tasks = new List<Task>();

            foreach (var item in servers)
            {
                var serverData = item.Value;

                async Task initServerData()
                {
                    try
                    {
                        var extraSettingsTask = GetFactorioServerExtraSettings(serverData);
                        var versionTask = GetVersion(serverData);

                        await Task.WhenAll(extraSettingsTask, versionTask);

                        serverData.Lock(md =>
                        {
                            md.ServerExtraSettings = extraSettingsTask.Result;
                            md.Version = versionTask.Result;
                        });
                    }
                    catch (Exception e)
                    {
                        _logger.LogError(nameof(Init), e);
                    }
                }

                tasks.Add(Task.Run(initServerData));
            }

            Task.WhenAll(tasks).GetAwaiter().GetResult();
        }

        public bool IsValidSaveDirectory(string path)
        {
            return validSaveDirectories.Contains(path);
        }

        public bool TryGetServerData(string serverId, out FactorioServerData serverData)
        {
            return servers.TryGetValue(serverId, out serverData);
        }

        public bool IsValidServerId(string serverId)
        {
            return servers.ContainsKey(serverId);
        }

        private async Task<FactorioServerExtraSettings> GetFactorioServerExtraSettings(FactorioServerData serverData)
        {
            try
            {
                var fi = new FileInfo(serverData.Constants.ServerExtraSettingsPath);
                if (fi.Exists)
                {
                    var data = await File.ReadAllTextAsync(fi.FullName);
                    return JsonConvert.DeserializeObject<FactorioServerExtraSettings>(data) ?? FactorioServerExtraSettings.MakeDefault();
                }
            }
            catch
            {
            }

            return FactorioServerExtraSettings.MakeDefault();
        }

        private Task<string> GetVersion(FactorioServerData serverData)
        {
            return Task.Run(() => FactorioVersionFinder.GetVersionString(serverData.ExecutablePath));
        }
    }
}
