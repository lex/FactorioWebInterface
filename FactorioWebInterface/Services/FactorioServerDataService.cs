using FactorioWebInterface.Models;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.IO;
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

        bool TryGetServerData(string serverId, [MaybeNullWhen(false)] out FactorioServerData serverData);

        bool IsValidServerId(string serverId);

        bool IsValidSaveDirectory(string path);

        Task Init();
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
            FactorioWrapperPath = "C:/Projects/FactorioWebInterface/FactorioWrapper/bin/Windows/net6.0/FactorioWrapper.exe";
#elif WSL
            FactorioWrapperPath = "/mnt/c/Projects/FactorioWebInterface/FactorioWrapper/bin/Wsl/net6.0/publish/FactorioWrapper";
#else
            FactorioWrapperPath = $"/factorio/{factorioServerDataConfiguration.FactorioWrapperName}/FactorioWrapper";
#endif

            validSaveDirectories.Add(Constants.GlobalSavesDirectoryName);
            validSaveDirectories.Add(Constants.PublicStartSavesDirectoryName);
            validSaveDirectories.Add(Constants.PublicFinalSavesDirectoryName);
            validSaveDirectories.Add(Constants.PublicOldSavesDirectoryName);
            validSaveDirectories.Add(Constants.WindowsPublicStartSavesDirectoryName);
            validSaveDirectories.Add(Constants.WindowsPublicFinalSavesDirectoryName);
            validSaveDirectories.Add(Constants.WindowsPublicOldSavesDirectoryName);

            for (int serverNumber = 1; serverNumber <= factorioServerDataConfiguration.ServerCount; serverNumber++)
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

        public Task Init()
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
                        var runningSettingsTask = GetFactorioServerRunningSettings(serverData);
                        var extraDataTask = GetFactorioServerExtraData(serverData);
                        var versionTask = GetVersion(serverData);

                        await Task.WhenAll(extraSettingsTask, runningSettingsTask, extraDataTask, versionTask);

                        serverData.Lock(md =>
                        {
                            md.ServerExtraSettings = extraSettingsTask.Result;
                            md.ServerRunningSettings = runningSettingsTask.Result;
                            md.ModPack = extraDataTask.Result?.SelectedModPack ?? "";
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

            return Task.WhenAll(tasks);
        }

        public bool IsValidSaveDirectory(string path)
        {
            return validSaveDirectories.Contains(path);
        }

        public bool TryGetServerData(string serverId, [MaybeNullWhen(false)] out FactorioServerData serverData)
        {
            if (serverId is null)
            {
                serverData = null;
                return false;
            }

            return servers.TryGetValue(serverId, out serverData!);
        }

        public bool IsValidServerId(string serverId)
        {
            return serverId is not null && servers.ContainsKey(serverId);
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

        private async Task<FactorioServerExtraData?> GetFactorioServerExtraData(FactorioServerData serverData)
        {
            try
            {
                var fi = new FileInfo(serverData.Constants.ServerExtraDataPath);
                if (fi.Exists)
                {
                    var bytes = await File.ReadAllBytesAsync(fi.FullName);
                    return System.Text.Json.JsonSerializer.Deserialize<FactorioServerExtraData>(bytes.AsSpan());
                }
            }
            catch
            {
            }

            return null;
        }

        private async Task<FactorioServerSettings?> GetFactorioServerRunningSettings(FactorioServerData serverData)
        {
            try
            {
                var fi = new FileInfo(serverData.Constants.ServerRunningSettingsPath);
                if (fi.Exists)
                {
                    var data = await File.ReadAllTextAsync(fi.FullName);
                    return JsonConvert.DeserializeObject<FactorioServerSettings>(data);
                }
            }
            catch
            {
            }

            return null;
        }

        private Task<string> GetVersion(FactorioServerData serverData)
        {
            return Task.Run(() => FactorioVersionFinder.GetVersionString(serverData.ExecutablePath));
        }
    }
}
