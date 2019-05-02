using DSharpPlus;
using DSharpPlus.Entities;
using FactorioWebInterface.Data;
using FactorioWebInterface.Hubs;
using FactorioWebInterface.Utils;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Shared;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace FactorioWebInterface.Models
{
    public class FactorioServerManager : IFactorioServerManager
    {
        // Match on first [*] and capture everything after.
        private static readonly Regex tag_regex = new Regex(@"(\[[^\[\]]+\])\s*((?:.|\s)*)\s*", RegexOptions.Compiled);

        private static readonly JsonSerializerSettings banListSerializerSettings = new JsonSerializerSettings()
        {
            Formatting = Formatting.Indented,
            NullValueHandling = NullValueHandling.Ignore
        };

        private readonly IConfiguration _configuration;
        private readonly DiscordBotContext _discordBotContext;
        private readonly IHubContext<FactorioProcessHub, IFactorioProcessClientMethods> _factorioProcessHub;
        private readonly IHubContext<FactorioControlHub, IFactorioControlClientMethods> _factorioControlHub;
        private readonly IHubContext<ScenarioDataHub, IScenarioDataClientMethods> _scenariolHub;
        private readonly IHubContext<FactorioBanHub, IFactorioBanClientMethods> _factorioBanHub;
        private readonly DbContextFactory _dbContextFactory;
        private readonly ILogger<FactorioServerManager> _logger;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly FactorioUpdater _factorioUpdater;

        //private SemaphoreSlim serverLock = new SemaphoreSlim(1, 1);
        private Dictionary<string, FactorioServerData> servers = FactorioServerData.Servers;

        private readonly string factorioWrapperName;

        public FactorioServerManager
        (
            IConfiguration configuration,
            DiscordBotContext discordBotContext,
            IHubContext<FactorioProcessHub, IFactorioProcessClientMethods> factorioProcessHub,
            IHubContext<FactorioControlHub, IFactorioControlClientMethods> factorioControlHub,
            IHubContext<ScenarioDataHub, IScenarioDataClientMethods> scenariolHub,
            IHubContext<FactorioBanHub, IFactorioBanClientMethods> factorioBanHub,
            DbContextFactory dbContextFactory,
            ILogger<FactorioServerManager> logger,
            IHttpClientFactory httpClientFactory,
            FactorioUpdater factorioUpdater
        )
        {
            _configuration = configuration;
            _discordBotContext = discordBotContext;
            _factorioProcessHub = factorioProcessHub;
            _factorioControlHub = factorioControlHub;
            _scenariolHub = scenariolHub;
            _factorioBanHub = factorioBanHub;
            _dbContextFactory = dbContextFactory;
            _logger = logger;
            _httpClientFactory = httpClientFactory;
            _factorioUpdater = factorioUpdater;

            string name = _configuration[Constants.FactorioWrapperNameKey];
            if (string.IsNullOrWhiteSpace(name))
            {
                factorioWrapperName = "factorioWrapper";
            }
            else
            {
                factorioWrapperName = name;
            }

            _discordBotContext.FactorioDiscordDataReceived += FactorioDiscordDataReceived;
        }

        private Task SendControlMessageNonLocking(FactorioServerData serverData, MessageData message)
        {
            serverData.ControlMessageBuffer.Add(message);
            return _factorioControlHub.Clients.Groups(serverData.ServerId).SendMessage(message);
        }

        private Task ChangeStatusNonLocking(FactorioServerData serverData, FactorioServerStatus newStatus, string byUser = "")
        {
            var oldStatus = serverData.Status;
            serverData.Status = newStatus;

            string oldStatusString = oldStatus.ToString();
            string newStatusString = newStatus.ToString();

            MessageData message;
            if (byUser == "")
            {
                message = new MessageData()
                {
                    ServerId = serverData.ServerId,
                    MessageType = MessageType.Status,
                    Message = $"[STATUS] Change from {oldStatusString} to {newStatusString}"
                };
            }
            else
            {
                message = new MessageData()
                {
                    ServerId = serverData.ServerId,
                    MessageType = MessageType.Status,
                    Message = $"[STATUS] Change from {oldStatusString} to {newStatusString} by user {byUser}"
                };
            }

            var group = _factorioControlHub.Clients.Groups(serverData.ServerId);

            return Task.WhenAll(group.FactorioStatusChanged(newStatusString, oldStatusString), group.SendMessage(message));
        }

        private string SanitizeGameChat(string message)
        {
            return Formatter.Sanitize(message).Replace("@", "@\u200B");
        }

        private string SanitizeDiscordChat(string message)
        {
            StringBuilder sb = new StringBuilder(message);

            sb.Replace("\\", "\\\\");
            sb.Replace("'", "\\'");
            sb.Replace("\n", " ");

            return sb.ToString();
        }

        private void FactorioDiscordDataReceived(DiscordBotContext sender, ServerMessageEventArgs eventArgs)
        {
            var serverId = eventArgs.ServerId;
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknown serverId: {serverId}", serverId);
                return;
            }

            if (serverData.ExtraServerSettings.DiscordToGameChat)
            {
                var name = SanitizeDiscordChat(eventArgs.User.Username);
                var message = SanitizeDiscordChat(eventArgs.Message);

                string data = $"/silent-command game.print('[Discord] {name}: {message}')";
                SendToFactorioProcess(eventArgs.ServerId, data);

                LogChat(serverId, $"[Discord] {name}: {message}", DateTime.UtcNow);
            }

            var messageData = new MessageData()
            {
                ServerId = serverId,
                MessageType = MessageType.Discord,
                Message = $"[Discord] {eventArgs.User.Username}: {eventArgs.Message}"
            };

            _ = SendToFactorioControl(eventArgs.ServerId, messageData);
        }

        private static string MakeLogFilePath(FactorioServerData serverData, FileInfo file, DirectoryInfo logDirectory)
        {
            string timeStamp = file.CreationTimeUtc.ToString("yyyyMMddHHmmss");
            string logName = Path.GetFileNameWithoutExtension(file.Name);

            return Path.Combine(logDirectory.FullName, $"{logName}{timeStamp}.log");
        }

        private void RotateFactorioLogs(FactorioServerData serverData)
        {
            try
            {
                var dir = new DirectoryInfo(serverData.LogsDirectoryPath);
                if (!dir.Exists)
                {
                    dir.Create();
                }

                var currentLog = new FileInfo(serverData.CurrentLogPath);
                if (!currentLog.Exists)
                {
                    using (_ = currentLog.Create()) { }
                    currentLog.CreationTimeUtc = DateTime.UtcNow;
                    return;
                }

                if (currentLog.Length == 0)
                {
                    currentLog.CreationTimeUtc = DateTime.UtcNow;
                    return;
                }

                string path = MakeLogFilePath(serverData, currentLog, dir);
                if (File.Exists(path))
                {
                    File.Delete(path);
                }

                currentLog.MoveTo(path);

                var newFile = new FileInfo(serverData.CurrentLogPath);
                using (_ = newFile.Create()) { }
                newFile.CreationTimeUtc = DateTime.UtcNow;

                var logs = dir.GetFiles("*.log");

                int removeCount = logs.Length - FactorioServerData.maxLogFiles + 1;
                if (removeCount <= 0)
                {
                    return;
                }

                var archiveDir = new DirectoryInfo(serverData.ArchiveLogsDirectoryPath);
                if (!archiveDir.Exists)
                {
                    archiveDir.Create();
                }

                // sort oldest first.
                Array.Sort(logs, (a, b) => a.CreationTimeUtc.CompareTo(b.CreationTimeUtc));

                for (int i = 0; i < removeCount && i < logs.Length; i++)
                {
                    var log = logs[i];

                    var archivePath = Path.Combine(archiveDir.FullName, log.Name);

                    log.MoveTo(archivePath);
                }
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(RotateFactorioLogs));
            }
        }

        private void RotateChatLogs(FactorioServerData serverData)
        {
            void BuildLogger(FileInfo file)
            {
                file.CreationTimeUtc = DateTime.UtcNow;
                serverData.BuildChatLogger();
            }

            try
            {
                var dir = new DirectoryInfo(serverData.ChatLogsDirectoryPath);
                if (!dir.Exists)
                {
                    dir.Create();
                }

                serverData.ChatLogger?.Dispose();
                serverData.ChatLogger = null;

                var currentLog = new FileInfo(serverData.ChatLogCurrentPath);
                if (!currentLog.Exists)
                {
                    using (_ = currentLog.Create()) { }
                    BuildLogger(currentLog);
                    return;
                }

                if (currentLog.Length == 0)
                {
                    BuildLogger(currentLog);
                    return;
                }

                string path = MakeLogFilePath(serverData, currentLog, dir);
                if (File.Exists(path))
                {
                    File.Delete(path);
                }

                currentLog.MoveTo(path);

                var newFile = new FileInfo(serverData.ChatLogCurrentPath);
                using (_ = newFile.Create()) { }
                BuildLogger(newFile);

                var logs = dir.GetFiles("*.log");

                int removeCount = logs.Length - FactorioServerData.maxLogFiles;
                if (removeCount <= 0)
                {
                    return;
                }

                var archiveDir = new DirectoryInfo(serverData.ChatLogsArchiveDirectoryPath);
                if (!archiveDir.Exists)
                {
                    archiveDir.Create();
                }

                // sort oldest first.
                Array.Sort(logs, (a, b) => a.CreationTimeUtc.CompareTo(b.CreationTimeUtc));

                for (int i = 0; i < removeCount && i < logs.Length; i++)
                {
                    var log = logs[i];

                    var archivePath = Path.Combine(archiveDir.FullName, log.Name);

                    log.MoveTo(archivePath);
                }
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(RotateChatLogs));
            }
        }

        private Task RotateLogs(FactorioServerData serverData)
        {
            return Task.Run(() =>
            {
                RotateFactorioLogs(serverData);
                RotateChatLogs(serverData);
            });
        }

        private async Task BuildBanList(FactorioServerData serverData)
        {
            if (!serverData.ExtraServerSettings.BuildBansFromDatabaseOnStart)
            {
                // If we don't want the database bans, the assumption is we should leave the
                // server banlist alone with whatever bans are in there.
                return;
            }

            try
            {
                var db = _dbContextFactory.Create<ApplicationDbContext>();

                var bans = await db.Bans.Select(b => new ServerBan()
                {
                    Username = b.Username,
                    Address = b.Address,
                    Reason = b.Reason
                })
                .ToArrayAsync();

                string data = JsonConvert.SerializeObject(bans, banListSerializerSettings);

                await File.WriteAllTextAsync(serverData.ServerBanListPath, data);
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(BuildBanList));
            }
        }

        private async Task BuildAdminList(FactorioServerData serverData)
        {
            var settings = serverData.ServerSettings;

            if (!settings.UseDefaultAdmins)
            {
                return;
            }

            var a = await GetAdminsAsync();
            var admins = a.Select(x => x.Name).ToList();

            serverData.ServerAdminList = admins;

            var adminData = JsonConvert.SerializeObject(admins, Formatting.Indented);

            await File.WriteAllTextAsync(serverData.ServerAdminListPath, adminData);
        }

        private void SendToEachRunningServer(string data)
        {
            var clients = _factorioProcessHub.Clients;
            foreach (var server in servers)
            {
                if (server.Value.Status == FactorioServerStatus.Running)
                {
                    clients.Group(server.Key).SendToFactorio(data);
                }
            }
        }

        private void SendBanCommandToEachRunningServer(string data)
        {
            var clients = _factorioProcessHub.Clients;
            foreach (var server in servers)
            {
                var serverData = server.Value;
                if (serverData.Status == FactorioServerStatus.Running && serverData.ExtraServerSettings.SyncBans)
                {
                    clients.Group(server.Key).SendToFactorio(data);
                }
            }
        }

        private void SendBanCommandToEachRunningServerExcept(string data, string exceptId)
        {
            var clients = _factorioProcessHub.Clients;
            foreach (var server in servers)
            {
                var serverData = server.Value;
                if (server.Key != exceptId && serverData.Status == FactorioServerStatus.Running && serverData.ExtraServerSettings.SyncBans)
                {
                    clients.Group(server.Key).SendToFactorio(data);
                }
            }
        }

        private void SendToEachRunningServerExcept(string data, string exceptId)
        {
            var clients = _factorioProcessHub.Clients;
            foreach (var server in servers)
            {
                if (server.Key != exceptId && server.Value.Status == FactorioServerStatus.Running)
                {
                    clients.Group(server.Key).SendToFactorio(data);
                }
            }
        }

        private async Task PrepareServer(FactorioServerData serverData)
        {
            var banTask = BuildBanList(serverData);
            var adminTask = BuildAdminList(serverData);
            var logTask = RotateLogs(serverData);

            serverData.TrackingDataSets.Clear();

            serverData.OnlinePlayers.Clear();
            serverData.OnlinePlayerCount = 0;

            await banTask;
            await adminTask;
            await logTask;
        }

        public bool IsValidServerId(string serverId)
        {
            return servers.ContainsKey(serverId);
        }

        public async Task<Result> Resume(string serverId, string userName)
        {
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknown serverId: {serverId}", serverId);
                return Result.Failure(Constants.ServerIdErrorKey, $"serverId {serverId} not found.");
            }

            try
            {
                await serverData.ServerLock.WaitAsync();

                switch (serverData.Status)
                {
                    case FactorioServerStatus.Unknown:
                    case FactorioServerStatus.Stopped:
                    case FactorioServerStatus.Killed:
                    case FactorioServerStatus.Crashed:
                    case FactorioServerStatus.Updated:

                        var tempSaves = new DirectoryInfo(serverData.TempSavesDirectoryPath);
                        if (!tempSaves.EnumerateFiles("*.zip").Any())
                        {
                            return Result.Failure(Constants.MissingFileErrorKey, "No file to resume server from.");
                        }

                        await PrepareServer(serverData);

                        string basePath = serverData.BaseDirectoryPath;

                        string fullName;
                        string arguments;
#if WINDOWS
                        fullName = "C:/Program Files/dotnet/dotnet.exe";
                        arguments = $"C:/Projects/FactorioWebInterface/FactorioWrapper/bin/Windows/netcoreapp2.2/FactorioWrapper.dll {serverId} {basePath}/bin/x64/factorio.exe --start-server-load-latest --server-settings {basePath}/server-settings.json --port {serverData.Port}";
#elif WSL
                        fullName = "/usr/bin/dotnet";
                        arguments = $"/mnt/c/Projects/FactorioWebInterface/FactorioWrapper/bin/Wsl/netcoreapp2.2/publish/FactorioWrapper.dll {serverId} {basePath}/bin/x64/factorio --start-server-load-latest --server-settings {basePath}/server-settings.json --port {serverData.Port}";
#else
                        if (serverData.IsRemote)
                        {
                            fullName = "ssh";
                            arguments = $"{serverData.SshIdentity} '/factorio/{factorioWrapperName}/FactorioWrapper.dll {serverId} {basePath}/bin/x64/factorio --start-server-load-latest --server-settings {basePath}/server-settings.json --port {serverData.Port}'";
                        }
                        else
                        {
                            fullName = "/usr/bin/dotnet";
                            arguments = $"/factorio/{factorioWrapperName}/FactorioWrapper.dll {serverId} {basePath}/bin/x64/factorio --start-server-load-latest --server-settings {basePath}/server-settings.json --port {serverData.Port}";
                        }
#endif
                        var startInfo = new ProcessStartInfo
                        {
                            FileName = fullName,
                            Arguments = arguments,

                            UseShellExecute = false,
                            CreateNoWindow = true
                        };

                        try
                        {
                            Process.Start(startInfo);
                        }
                        catch (Exception)
                        {
                            _logger.LogError("Error resumeing serverId: {serverId}", serverId);
                            return Result.Failure(Constants.WrapperProcessErrorKey, "Wrapper process failed to start.");
                        }

                        _logger.LogInformation("Server resumed serverId: {serverId} user: {userName}", serverId, userName);

                        var group = _factorioControlHub.Clients.Group(serverId);
                        await group.FactorioStatusChanged(FactorioServerStatus.WrapperStarting.ToString(), serverData.Status.ToString());
                        serverData.Status = FactorioServerStatus.WrapperStarting;

                        var message = new MessageData()
                        {
                            ServerId = serverId,
                            MessageType = MessageType.Control,
                            Message = $"Server resumed by user: {userName}"
                        };

                        serverData.ControlMessageBuffer.Add(message);
                        await group.SendMessage(message);

                        return Result.OK;
                    default:
                        return Result.Failure(Constants.InvalidServerStateErrorKey, $"Cannot resume server when in state {serverData.Status}");
                }
            }
            catch (Exception e)
            {
                _logger.LogError("Error loading", e);
                return Result.Failure(Constants.UnexpctedErrorKey);
            }
            finally
            {
                serverData.ServerLock.Release();
            }
        }

        public async Task<Result> Load(string serverId, string directoryName, string fileName, string userName)
        {
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknown serverId: {serverId}", serverId);
                return Result.Failure(Constants.ServerIdErrorKey, $"serverId {serverId} not found.");
            }

            var saveFile = GetSaveFile(directoryName, fileName);
            if (saveFile == null)
            {
                return Result.Failure(Constants.MissingFileErrorKey, $"File {Path.Combine(directoryName, fileName)} not found.");
            }

            try
            {
                await serverData.ServerLock.WaitAsync();

                switch (serverData.Status)
                {
                    case FactorioServerStatus.Unknown:
                    case FactorioServerStatus.Stopped:
                    case FactorioServerStatus.Killed:
                    case FactorioServerStatus.Crashed:
                    case FactorioServerStatus.Updated:

                        switch (saveFile.Directory.Name)
                        {
                            case Constants.GlobalSavesDirectoryName:
                            case Constants.LocalSavesDirectoryName:
                                string copyToPath = Path.Combine(serverData.TempSavesDirectoryPath, saveFile.Name);
                                saveFile.CopyTo(copyToPath, true);
                                break;
                            case Constants.TempSavesDirectoryName:
                                break;
                            default:
                                return Result.Failure(Constants.UnexpctedErrorKey, $"File {saveFile.FullName}.");
                        }

                        await PrepareServer(serverData);

                        string basePath = serverData.BaseDirectoryPath;

                        string fullName;
                        string arguments;
#if WINDOWS
                        fullName = "C:/Program Files/dotnet/dotnet.exe";
                        arguments = $"C:/Projects/FactorioWebInterface/FactorioWrapper/bin/Windows/netcoreapp2.2/FactorioWrapper.dll {serverId} {basePath}/bin/x64/factorio.exe --start-server {saveFile.Name} --server-settings {basePath}/server-settings.json --port {serverData.Port}";
#elif WSL
                        fullName = "/usr/bin/dotnet";
                        arguments = $"/mnt/c/Projects/FactorioWebInterface/FactorioWrapper/bin/Wsl/netcoreapp2.2/publish/FactorioWrapper.dll {serverId} {basePath}/bin/x64/factorio --start-server {saveFile.Name} --server-settings {basePath}/server-settings.json --port {serverData.Port}";
#else
                        if (serverData.IsRemote)
                        {
                            fullName = "ssh";
                            arguments = $"{serverData.SshIdentity} '/factorio/{factorioWrapperName}/FactorioWrapper.dll {serverId} {basePath}/bin/x64/factorio --start-server {saveFile.Name} --server-settings {basePath}/server-settings.json --port {serverData.Port}'";
                        }
                        else
                        {
                            fullName = "/usr/bin/dotnet";
                            arguments = $"/factorio/{factorioWrapperName}/FactorioWrapper.dll {serverId} {basePath}/bin/x64/factorio --start-server {saveFile.Name} --server-settings {basePath}/server-settings.json --port {serverData.Port}";
                        }
#endif
                        var startInfo = new ProcessStartInfo
                        {
                            FileName = fullName,
                            Arguments = arguments,

                            UseShellExecute = false,
                            CreateNoWindow = true
                        };

                        try
                        {
                            Process.Start(startInfo);
                        }
                        catch (Exception)
                        {
                            _logger.LogError("Error loading serverId: {serverId} file: {file}", serverId, saveFile.FullName);
                            return Result.Failure(Constants.WrapperProcessErrorKey, "Wrapper process failed to start.");
                        }

                        _logger.LogInformation("Server load serverId: {serverId} file: {file} user: {userName}", serverId, saveFile.FullName, userName);

                        serverData.Status = FactorioServerStatus.WrapperStarting;

                        var group = _factorioControlHub.Clients.Group(serverId);
                        await group.FactorioStatusChanged(FactorioServerStatus.WrapperStarting.ToString(), serverData.Status.ToString());

                        var message = new MessageData()
                        {
                            ServerId = serverId,
                            MessageType = MessageType.Control,
                            Message = $"Server load file: {saveFile.Name} by user: {userName}"
                        };

                        serverData.ControlMessageBuffer.Add(message);
                        await group.SendMessage(message);

                        return Result.OK;

                    default:
                        return Result.Failure(Constants.InvalidServerStateErrorKey, $"Cannot load server when in state {serverData.Status}");
                }
            }
            catch (Exception e)
            {
                _logger.LogError("Error loading", e);
                return Result.Failure(Constants.UnexpctedErrorKey);
            }
            finally
            {
                serverData.ServerLock.Release();
            }
        }

        private Result ValidateSceanrioName(string scenarioName)
        {
            string scenarioPath = Path.Combine(FactorioServerData.ScenarioDirectoryPath, scenarioName);
            scenarioPath = Path.GetFullPath(scenarioPath);
            if (!scenarioPath.StartsWith(FactorioServerData.ScenarioDirectoryPath))
            {
                return Result.Failure(Constants.MissingFileErrorKey, $"Scenario {scenarioName} not found.");
            }

            var scenarioDir = new DirectoryInfo(scenarioPath);
            if (!scenarioDir.Exists)
            {
                return Result.Failure(Constants.MissingFileErrorKey, $"Scenario {scenarioName} not found.");
            }

            return Result.OK;
        }

        private async Task<Result> StartScenarioInner(FactorioServerData serverData, string scenarioName, string userName)
        {
            string basePath = serverData.BaseDirectoryPath;
            string serverId = serverData.ServerId;
            string localScenarioDirectoryPath = serverData.LocalScenarioDirectoryPath;

            var dir = new DirectoryInfo(localScenarioDirectoryPath);
            if (!dir.Exists)
            {
                FileHelpers.CreateDirectorySymlink(FactorioServerData.ScenarioDirectoryPath, localScenarioDirectoryPath);
            }
            else if (!FileHelpers.IsSymbolicLink(localScenarioDirectoryPath))
            {
                dir.Delete(true);
                FileHelpers.CreateDirectorySymlink(FactorioServerData.ScenarioDirectoryPath, localScenarioDirectoryPath);
            }

            await PrepareServer(serverData);

            string fullName;
            string arguments;
#if WINDOWS
            fullName = "C:/Program Files/dotnet/dotnet.exe";
            arguments = $"C:/Projects/FactorioWebInterface/FactorioWrapper/bin/Windows/netcoreapp2.2/FactorioWrapper.dll {serverId} {basePath}/bin/x64/factorio.exe --start-server-load-scenario {scenarioName} --server-settings {basePath}/server-settings.json --port {serverData.Port}";
#elif WSL
            fullName = "/usr/bin/dotnet";
            arguments = $"/mnt/c/Projects/FactorioWebInterface/FactorioWrapper/bin/Wsl/netcoreapp2.2/publish/FactorioWrapper.dll {serverId} {basePath}/bin/x64/factorio --start-server-load-scenario {scenarioName} --server-settings {basePath}/server-settings.json --port {serverData.Port}";
#else
            if (serverData.IsRemote)
            {
                fullName = "ssh";
                arguments = $"{serverData.SshIdentity} '/factorio/{factorioWrapperName}/FactorioWrapper.dll {serverId} {basePath}/bin/x64/factorio --start-server-load-scenario {scenarioName} --server-settings {basePath}/server-settings.json --port {serverData.Port}'";
            }
            else
            {
                fullName = "/usr/bin/dotnet";
                arguments = $"/factorio/{factorioWrapperName}/FactorioWrapper.dll {serverId} {basePath}/bin/x64/factorio --start-server-load-scenario {scenarioName} --server-settings {basePath}/server-settings.json --port {serverData.Port}";
            }
#endif
            var startInfo = new ProcessStartInfo
            {
                FileName = fullName,
                Arguments = arguments,

                UseShellExecute = false,
                CreateNoWindow = true
            };

            try
            {
                Process.Start(startInfo);
            }
            catch (Exception)
            {
                _logger.LogError("Error loading scenario serverId: {serverId} file: {file}", serverId, scenarioName);
                return Result.Failure(Constants.WrapperProcessErrorKey, "Wrapper process failed to start.");
            }

            _logger.LogInformation("Server load serverId: {serverId} scenario: {scenario} user: {userName}", serverData.ServerId, scenarioName, userName);

            serverData.Status = FactorioServerStatus.WrapperStarting;

            var group = _factorioControlHub.Clients.Group(serverData.ServerId);
            await group.FactorioStatusChanged(FactorioServerStatus.WrapperStarting.ToString(), serverData.Status.ToString());

            var message = new MessageData()
            {
                ServerId = serverId,
                MessageType = MessageType.Control,
                Message = $"Server load scenario: {scenarioName} by user: {userName}"
            };

            serverData.ControlMessageBuffer.Add(message);
            await group.SendMessage(message);

            return Result.OK;
        }

        public async Task<Result> StartScenario(string serverId, string scenarioName, string userName)
        {
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknown serverId: {serverId}", serverId);
                return Result.Failure(Constants.ServerIdErrorKey, $"serverId {serverId} not found.");
            }

            var result = ValidateSceanrioName(scenarioName);
            if (!result.Success)
            {
                return result;
            }

            try
            {
                await serverData.ServerLock.WaitAsync();

                switch (serverData.Status)
                {
                    case FactorioServerStatus.Unknown:
                    case FactorioServerStatus.Stopped:
                    case FactorioServerStatus.Killed:
                    case FactorioServerStatus.Crashed:
                    case FactorioServerStatus.Updated:
                        return await StartScenarioInner(serverData, scenarioName, userName);
                    default:
                        return Result.Failure(Constants.InvalidServerStateErrorKey, $"Cannot load scenario when server in state {serverData.Status}");
                }
            }
            catch (Exception e)
            {
                _logger.LogError("Error loading scenario", e);
                return Result.Failure(Constants.UnexpctedErrorKey);
            }
            finally
            {
                serverData.ServerLock.Release();
            }
        }

        public async Task<Result> ForceStartScenario(string serverId, string scenarioName, string userName)
        {
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknown serverId: {serverId}", serverId);
                return Result.Failure(Constants.ServerIdErrorKey, $"serverId {serverId} not found.");
            }

            var result = ValidateSceanrioName(scenarioName);
            if (!result.Success)
            {
                return result;
            }

            try
            {
                await serverData.ServerLock.WaitAsync();

                switch (serverData.Status)
                {
                    case FactorioServerStatus.Unknown:
                    case FactorioServerStatus.Stopped:
                    case FactorioServerStatus.Killed:
                    case FactorioServerStatus.Crashed:
                    case FactorioServerStatus.Updated:
                        return await StartScenarioInner(serverData, scenarioName, userName);
                    case FactorioServerStatus.Running:
                        serverData.StopCallback = () => StartScenarioInner(serverData, scenarioName, userName);

                        await StopInner(serverId, userName);

                        return Result.OK;
                    default:
                        return Result.Failure(Constants.InvalidServerStateErrorKey, $"Cannot force start scenario when server in state {serverData.Status}");
                }
            }
            finally
            {
                serverData.ServerLock.Release();
            }
        }

        private async Task StopInner(string serverId, string userName)
        {
            var message = new MessageData()
            {
                ServerId = serverId,
                MessageType = MessageType.Control,
                Message = $"Server stopped by user {userName}"
            };

            _ = SendToFactorioControl(serverId, message);

            await _factorioProcessHub.Clients.Groups(serverId).Stop();

            _logger.LogInformation("server stopped :serverId {serverId} user: {userName}", serverId, userName);
        }
#pragma warning disable CS1998
        public async Task<Result> Stop(string serverId, string userName)
        {
#pragma warning restore CS1998
#if WINDOWS
            return Result.Failure(Constants.NotSupportedErrorKey, "Stop is not supported on Windows.");
#else
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknown serverId: {serverId}", serverId);
                return Result.Failure(Constants.ServerIdErrorKey, $"serverId {serverId} not found.");
            }

            switch (serverData.Status)
            {
                case FactorioServerStatus.Unknown:
                case FactorioServerStatus.WrapperStarted:
                case FactorioServerStatus.Starting:
                case FactorioServerStatus.Running:
                case FactorioServerStatus.Updated:
                    break;
                default:
                    return Result.Failure(Constants.InvalidServerStateErrorKey, $"Cannot stop server when in state {serverData.Status}");
            }

            try
            {
                await serverData.ServerLock.WaitAsync();
                serverData.StopCallback = null;
            }
            finally
            {
                serverData.ServerLock.Release();
            }

            await StopInner(serverId, userName);

            return Result.OK;
#endif
        }

        public async Task<Result> ForceStop(string serverId, string userName)
        {
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknown serverId: {serverId}", serverId);
                return Result.Failure(Constants.ServerIdErrorKey, $"serverId {serverId} not found.");
            }

            try
            {
                await serverData.ServerLock.WaitAsync();

                switch (serverData.Status)
                {
                    case FactorioServerStatus.WrapperStarting:
                        _ = ChangeStatusNonLocking(serverData, FactorioServerStatus.Killed, userName);
                        break;
                    case FactorioServerStatus.Unknown:
                    case FactorioServerStatus.WrapperStarted:
                    case FactorioServerStatus.Starting:
                    case FactorioServerStatus.Running:
                    case FactorioServerStatus.Stopping:
                    case FactorioServerStatus.Killing:
                    case FactorioServerStatus.Updated:
                        var message = new MessageData()
                        {
                            ServerId = serverId,
                            MessageType = MessageType.Control,
                            Message = $"Server killed by user {userName}"
                        };

                        _ = SendControlMessageNonLocking(serverData, message);

                        break;
                    default:
                        return Result.Failure(Constants.InvalidServerStateErrorKey, $"Cannot force stop server when in state {serverData.Status}");
                }

                serverData.StopCallback = null;
            }
            finally
            {
                serverData.ServerLock.Release();
            }

            await _factorioProcessHub.Clients.Groups(serverId).ForceStop();

            _logger.LogInformation("server killed :serverId {serverId} user: {userName}", serverId, userName);

            return Result.OK;
        }

        public async Task<Result> Save(string serverId, string userName, string saveName)
        {
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknown serverId: {serverId}", serverId);
                return Result.Failure(Constants.ServerIdErrorKey, $"serverId {serverId} not found.");
            }

            if (serverData.Status != FactorioServerStatus.Running)
                return Result.Failure(Constants.InvalidServerStateErrorKey, $"Cannot save game when in state {serverData.Status}");

            var message = new MessageData()
            {
                ServerId = serverId,
                MessageType = MessageType.Control,
                Message = $"Server saved by user {userName}"
            };
            _ = SendToFactorioControl(serverId, message);

            var command = FactorioCommandBuilder.SilentCommand()
                .Add("game.server_save(")
                .AddQuotedString(saveName)
                .Add(")")
                .Build();
            await SendToFactorioProcess(serverId, command);

            _logger.LogInformation("server saved :serverId {serverId} user: {userName}", serverId, userName);
            return Result.OK;
        }

        /// SignalR processes one message at a time, so this method needs to return before the downloading starts.
        /// Else if the user clicks the update button twice in quick succession, the first request is finished before
        /// the second requests starts, meaning the update will happen twice.
        private void InstallInner(string serverId, FactorioServerData serverData, string version)
        {
            _ = Task.Run(async () =>
            {
                var result = await _factorioUpdater.DoUpdate(serverData, version);

                try
                {
                    await serverData.ServerLock.WaitAsync();

                    var oldStatus = serverData.Status;
                    var group = _factorioControlHub.Clients.Group(serverId);

                    if (result.Success)
                    {
                        serverData.Status = FactorioServerStatus.Updated;

                        _ = group.FactorioStatusChanged(FactorioServerStatus.Updated.ToString(), oldStatus.ToString());

                        var messageData = new MessageData()
                        {
                            ServerId = serverId,
                            MessageType = MessageType.Status,
                            Message = $"[STATUS]: Changed from {oldStatus} to {FactorioServerStatus.Updated}"
                        };

                        serverData.ControlMessageBuffer.Add(messageData);
                        _ = group.SendMessage(messageData);

                        _logger.LogInformation("Updated server.");
                    }
                    else
                    {
                        serverData.Status = FactorioServerStatus.Crashed;

                        _ = group.FactorioStatusChanged(FactorioServerStatus.Crashed.ToString(), oldStatus.ToString());

                        var messageData = new MessageData()
                        {
                            ServerId = serverId,
                            MessageType = MessageType.Status,
                            Message = $"[STATUS]: Changed from {oldStatus} to {FactorioServerStatus.Crashed}"
                        };

                        serverData.ControlMessageBuffer.Add(messageData);
                        _ = group.SendMessage(messageData);

                        var messageData2 = new MessageData()
                        {
                            ServerId = serverId,
                            MessageType = MessageType.Control,
                            Message = result.ToString()
                        };

                        serverData.ControlMessageBuffer.Add(messageData2);
                        _ = group.SendMessage(messageData2);
                    }

                    serverData.Version = FactorioVersionFinder.GetVersionString(serverData.ExecutablePath);
                    _ = group.SendVersion(serverData.Version);
                }
                finally
                {
                    serverData.ServerLock.Release();
                }
            });
        }
#pragma warning disable CS1998
        public async Task<Result> Install(string serverId, string userName, string version)
        {
#pragma warning restore CS1998
#if WINDOWS
            return Result.Failure(Constants.NotSupportedErrorKey, "Install is not supported on windows.");
#else
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknow serverId: {serverId}", serverId);
                return Result.Failure($"Unknow serverId: {serverId}");
            }

            try
            {
                await serverData.ServerLock.WaitAsync();

                var oldStatus = serverData.Status;

                switch (oldStatus)
                {
                    case FactorioServerStatus.WrapperStarting:
                    case FactorioServerStatus.WrapperStarted:
                    case FactorioServerStatus.Starting:
                    case FactorioServerStatus.Running:
                    case FactorioServerStatus.Stopping:
                    case FactorioServerStatus.Killing:
                    case FactorioServerStatus.Updating:
                        return Result.Failure(Constants.InvalidServerStateErrorKey, $"Cannot Update server when in state {oldStatus}");
                    default:
                        break;
                }

                serverData.Status = FactorioServerStatus.Updating;

                var group = _factorioControlHub.Clients.Group(serverId);
                await group.FactorioStatusChanged(FactorioServerStatus.Updating.ToString(), oldStatus.ToString());

                var messageData = new MessageData()
                {
                    MessageType = MessageType.Status,
                    Message = $"[STATUS]: Changed from {oldStatus} to {FactorioServerStatus.Updating} by user {userName}"
                };

                serverData.ControlMessageBuffer.Add(messageData);
                await group.SendMessage(messageData);

                InstallInner(serverId, serverData, version);
            }
            finally
            {
                serverData.ServerLock.Release();
            }

            return Result.OK;
#endif
        }

        public async Task<FactorioServerStatus> GetStatus(string serverId)
        {
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknown serverId: {serverId}", serverId);
                return FactorioServerStatus.Unknown;
            }

            try
            {
                await serverData.ServerLock.WaitAsync();

                return serverData.Status;
            }
            finally
            {
                serverData.ServerLock.Release();
            }
        }

        public Task RequestStatus(string serverId)
        {
            return _factorioProcessHub.Clients.Group(serverId).GetStatus();
        }

        public Task SendToFactorioProcess(string serverId, string data)
        {
            return _factorioProcessHub.Clients.Group(serverId).SendToFactorio(data);
        }

        public async Task SendToFactorioControl(string serverId, MessageData data)
        {
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknow serverId: {serverId}", serverId);
                return;
            }

            try
            {
                await serverData.ServerLock.WaitAsync();
                serverData.ControlMessageBuffer.Add(data);
            }
            finally
            {
                serverData.ServerLock.Release();
            }

            await _factorioControlHub.Clients.Group(serverId).SendMessage(data);
        }

        public async Task<MessageData[]> GetFactorioControlMessagesAsync(string serverId)
        {
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknow serverId: {serverId}", serverId);
                return new MessageData[0];
            }

            try
            {
                await serverData.ServerLock.WaitAsync();

                var buffer = serverData.ControlMessageBuffer.TakeWhile(x => x != null).ToArray();
                return buffer;
            }
            finally
            {
                serverData.ServerLock.Release();
            }
        }

        public async Task FactorioDataReceived(string serverId, string data, DateTime dateTime)
        {
            if (data == null)
            {
                return;
            }

            var messageData = new MessageData()
            {
                ServerId = serverId,
                MessageType = MessageType.Output,
                Message = data
            };

            _ = SendToFactorioControl(serverId, messageData);

            var match = tag_regex.Match(data);
            if (!match.Success || match.Index > 20)
            {
                return;
            }

            var groups = match.Groups;
            string tag = groups[1].Value;
            string content = groups[2].Value;

            switch (tag)
            {
                case Constants.ChatTag:
                    {
                        if (!servers.TryGetValue(serverId, out var serverData))
                        {
                            _logger.LogError("Unknown serverId: {serverId}", serverId);
                            break;
                        }

                        if (serverData.ExtraServerSettings.GameChatToDiscord)
                        {
                            _ = _discordBotContext.SendToFactorioChannel(serverId, SanitizeGameChat(content));
                        }

                        LogChat(serverId, content, dateTime);
                        break;
                    }
                case Constants.ShoutTag:
                    {
                        if (!servers.TryGetValue(serverId, out var serverData))
                        {
                            _logger.LogError("Unknown serverId: {serverId}", serverId);
                            break;
                        }

                        if (serverData.ExtraServerSettings.GameShoutToDiscord)
                        {
                            _ = _discordBotContext.SendToFactorioChannel(serverId, SanitizeGameChat(content));
                        }

                        LogChat(serverId, content, dateTime);
                        break;
                    }
                case Constants.DiscordTag:
                    content = content.Replace("\\n", "\n");
                    content = SanitizeGameChat(content);
                    _ = _discordBotContext.SendToFactorioChannel(serverId, content);
                    break;
                case Constants.DiscordRawTag:
                    content = content.Replace("\\n", "\n");
                    _ = _discordBotContext.SendToFactorioChannel(serverId, content);
                    break;
                case Constants.DiscordBold:
                    content = content.Replace("\\n", "\n");
                    content = SanitizeGameChat(content);
                    content = Formatter.Bold(content);
                    _ = _discordBotContext.SendToFactorioChannel(serverId, content);
                    break;
                case Constants.DiscordAdminTag:
                    content = content.Replace("\\n", "\n");
                    content = SanitizeGameChat(content);
                    _ = _discordBotContext.SendToFactorioAdminChannel(content);
                    break;
                case Constants.DiscordAdminRawTag:
                    content = content.Replace("\\n", "\n");
                    _ = _discordBotContext.SendToFactorioAdminChannel(content);
                    break;
                case Constants.PlayerJoinTag:
                    _ = DoPlayerJoined(serverId, content);

                    LogChat(serverId, $"{Constants.PlayerJoinTag} {content}", dateTime);
                    break;
                case Constants.PlayerLeaveTag:
                    _ = DoPlayerLeft(serverId, content);

                    LogChat(serverId, $"{Constants.PlayerLeaveTag} {content}", dateTime);
                    break;
                case Constants.QueryPlayersTag:
                    _ = DoPlayerQuery(serverId, content);
                    break;
                case Constants.DiscordEmbedTag:
                    {
                        content = content.Replace("\\n", "\n");
                        content = SanitizeGameChat(content);

                        var embed = new DiscordEmbedBuilder()
                        {
                            Description = content,
                            Color = DiscordBot.infoColor,
                            Timestamp = DateTimeOffset.UtcNow
                        };

                        _ = _discordBotContext.SendEmbedToFactorioChannel(serverId, embed);
                        break;
                    }
                case Constants.DiscordEmbedRawTag:
                    {
                        content = content.Replace("\\n", "\n");

                        var embed = new DiscordEmbedBuilder()
                        {
                            Description = content,
                            Color = DiscordBot.infoColor,
                            Timestamp = DateTimeOffset.UtcNow
                        };

                        _ = _discordBotContext.SendEmbedToFactorioChannel(serverId, embed);
                        break;
                    }

                case Constants.DiscordAdminEmbedTag:
                    {
                        content = content.Replace("\\n", "\n");
                        content = SanitizeGameChat(content);

                        var embed = new DiscordEmbedBuilder()
                        {
                            Description = content,
                            Color = DiscordBot.infoColor,
                            Timestamp = DateTimeOffset.UtcNow
                        };

                        _ = _discordBotContext.SendEmbedToFactorioAdminChannel(embed);
                        break;
                    }
                case Constants.DiscordAdminEmbedRawTag:
                    {
                        content = content.Replace("\\n", "\n");

                        var embed = new DiscordEmbedBuilder()
                        {
                            Description = content,
                            Color = DiscordBot.infoColor,
                            Timestamp = DateTimeOffset.UtcNow
                        };

                        _ = _discordBotContext.SendEmbedToFactorioAdminChannel(embed);
                        break;
                    }
                case Constants.StartScenarioTag:
                    var result = await ForceStartScenario(serverId, content, "<server>");

                    if (!result.Success)
                    {
                        _ = SendToFactorioProcess(serverId, result.ToString());
                    }

                    break;
                case Constants.BanTag:
                    await DoBan(serverId, content);
                    break;
                case Constants.UnBannedTag:
                    await DoUnBan(serverId, content);
                    break;
                case Constants.BanSyncTag:
                    //await DoSyncBan(serverId, content);
                    break;
                case Constants.UnBannedSyncTag:
                    //await DoUnBannedSync(serverId, content);
                    break;
                case Constants.PingTag:
                    DoPing(serverId, content);
                    break;
                case Constants.DataSetTag:
                    _ = DoSetData(serverId, content);
                    break;
                case Constants.DataGetTag:
                    _ = DoGetData(serverId, content);
                    break;
                case Constants.DataGetAllTag:
                    _ = DoGetAllData(serverId, content);
                    break;
                case Constants.DataTrackedTag:
                    _ = DoTrackedData(serverId, content);
                    break;
                default:
                    break;
            }
        }

        private static string BuildServerTopicFromOnlinePlayers(SortedList<string, int> onlinePlayers, int count)
        {
            var sb = new StringBuilder();

            if (count == 0)
            {
                sb.Append("Players online 0");
                return sb.ToString();
            }
            else
            {
                sb.Append("Players online ").Append(count);
            }

            sb.Append(" - ");
            foreach (var item in onlinePlayers)
            {
                for (int i = 0; i < item.Value; i++)
                {
                    sb.Append(item.Key).Append(", ");
                }

                if (sb.Length > Constants.discordTopicMaxLength)
                {
                    int start = Constants.discordTopicMaxLength - 3;
                    int length = sb.Length - start;
                    sb.Remove(start, length);
                    sb.Append("...");
                    return sb.ToString();
                }
            }
            sb.Remove(sb.Length - 2, 2);

            return sb.ToString();
        }

        private async Task DoPlayerJoined(string serverId, string name)
        {
            if (name == null)
            {
                return;
            }

            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknow serverId: {serverId}", serverId);
                return;
            }

            string safeName = SanitizeGameChat(name);
            var t1 = _discordBotContext.SendToFactorioChannel(serverId, $"**{safeName} has joined the game**");

            string topic;

            try
            {
                await serverData.ServerLock.WaitAsync();

                var op = serverData.OnlinePlayers;
                if (op.TryGetValue(name, out int count))
                {
                    op[name] = count + 1;
                }
                else
                {
                    op.Add(name, 1);
                }

                int totalCount = serverData.OnlinePlayerCount + 1;
                serverData.OnlinePlayerCount = totalCount;
                topic = BuildServerTopicFromOnlinePlayers(op, totalCount);
            }
            finally
            {
                serverData.ServerLock.Release();
            }

            await _discordBotContext.SetChannelNameAndTopic(serverId, topic: topic);
            await t1;
        }

        private async Task DoPlayerLeft(string serverId, string name)
        {
            if (name == null)
            {
                return;
            }

            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknow serverId: {serverId}", serverId);
                return;
            }

            string safeName = SanitizeGameChat(name);
            var t1 = _discordBotContext.SendToFactorioChannel(serverId, $"**{safeName} has left the game**");

            string topic;

            try
            {
                await serverData.ServerLock.WaitAsync();

                var op = serverData.OnlinePlayers;
                if (op.TryGetValue(name, out int count))
                {
                    if (count == 1)
                    {
                        op.Remove(name);
                    }
                    else
                    {
                        op[name] = count - 1;
                    }
                }
                else
                {
                    _ = SendToFactorioProcess(serverId, FactorioCommandBuilder.Static.query_online_players);
                    return;
                }

                int totalCount = serverData.OnlinePlayerCount - 1;
                serverData.OnlinePlayerCount = totalCount;
                topic = BuildServerTopicFromOnlinePlayers(op, totalCount);
            }
            finally
            {
                serverData.ServerLock.Release();
            }

            await _discordBotContext.SetChannelNameAndTopic(serverId, topic: topic);
            await t1;
        }

        private async Task DoPlayerQuery(string serverId, string content)
        {
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknow serverId: {serverId}", serverId);
                return;
            }

            string[] players;
            try
            {
                players = JsonConvert.DeserializeObject<string[]>(content);
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(DoPlayerQuery) + " deserialization");
                return;
            }

            string topic;
            try
            {
                await serverData.ServerLock.WaitAsync();

                var op = serverData.OnlinePlayers;
                op.Clear();

                foreach (var player in players)
                {
                    if (op.TryGetValue(player, out int count))
                    {
                        op[player] = count + 1;
                    }
                    else
                    {
                        op[player] = 1;
                    }
                }

                serverData.OnlinePlayerCount = players.Length;
                topic = BuildServerTopicFromOnlinePlayers(op, players.Length);
            }
            finally
            {
                serverData.ServerLock.Release();
            }

            await _discordBotContext.SetChannelNameAndTopic(serverId, topic: topic);
        }

        private async Task DoTrackedData(string serverId, string content)
        {
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("DoTrackedData Unknown serverId: {serverId}", serverId);
                return;
            }

            string[] dataSets;
            try
            {
                dataSets = JsonConvert.DeserializeObject<string[]>(content);
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(DoTrackedData) + " deserialization");
                return;
            }

            try
            {
                await serverData.ServerLock.WaitAsync();

                var td = serverData.TrackingDataSets;
                td.Clear();
                foreach (var item in dataSets)
                {
                    td.Add(item);
                }
            }
            finally
            {
                serverData.ServerLock.Release();
            }
        }

        private async Task DoGetData(string serverId, string content)
        {
            int space = content.IndexOf(' ');
            if (space < 0)
            {
                return;
            }

            int rest = content.Length - space - 1;
            if (rest < 1)
            {
                return;
            }

            string func = content.Substring(0, space);
            string dataString = content.Substring(space + 1, rest);

            ScenarioDataEntry data;
            try
            {
                data = JsonConvert.DeserializeObject<ScenarioDataEntry>(dataString);
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(DoGetData) + " deserialization");
                return;
            }

            if (data.DataSet == null || data.Key == null)
            {
                return;
            }

            try
            {
                var db = _dbContextFactory.Create<ScenarioDbContext>();
                var entry = await db.ScenarioDataEntries.AsNoTracking().FirstOrDefaultAsync(x => x.DataSet == data.DataSet && x.Key == data.Key);

                var cb = FactorioCommandBuilder
                    .ServerCommand("raise_callback")
                    .Add(func)
                    .Add(",")
                    .Add("{data_set=").AddDoubleQuotedString(data.DataSet)
                    .Add(",key=").AddDoubleQuotedString(data.Key);

                if (entry != null)
                {
                    cb.Add(",value=").Add(entry.Value);
                }

                var command = cb.Add("}").Build();

                await SendToFactorioProcess(serverId, command);
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(DoGetData));
            }
        }

        private async Task DoGetAllData(string serverId, string content)
        {
            int space = content.IndexOf(' ');
            if (space < 0)
            {
                return;
            }

            int rest = content.Length - space - 1;
            if (rest < 1)
            {
                return;
            }

            string func = content.Substring(0, space);
            string dataString = content.Substring(space + 1, rest);

            ScenarioDataEntry data;
            try
            {
                data = JsonConvert.DeserializeObject<ScenarioDataEntry>(dataString);
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(DoGetAllData) + " deserialization");
                return;
            }

            if (data.DataSet == null)
            {
                return;
            }

            try
            {
                var db = _dbContextFactory.Create<ScenarioDbContext>();
                var entries = await db.ScenarioDataEntries.AsNoTracking().Where(x => x.DataSet == data.DataSet).ToArrayAsync();

                var cb = FactorioCommandBuilder
                        .ServerCommand("raise_callback")
                        .Add(func)
                        .Add(",")
                        .Add("{data_set=").AddDoubleQuotedString(data.DataSet);
                if (entries.Length == 0)
                {
                    cb.Add("}");
                }
                else
                {
                    cb.Add(",entries={");
                    for (int i = 0; i < entries.Length; i++)
                    {
                        var entry = entries[i];
                        cb.Add("[").AddDoubleQuotedString(entry.Key).Add("]=").Add(entry.Value).Add(",");
                    }
                    cb.RemoveLast(1);
                    cb.Add("}}");
                }

                var command = cb.Build();

                await SendToFactorioProcess(serverId, command);
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(DoGetAllData));
            }
        }

        private async Task SendDataToTrackingServers(string sourceId, ScenarioDataEntry data)
        {
            var dataSet = data.DataSet;

            var cb = FactorioCommandBuilder
                .ServerCommand("raise_data_set")
                .Add("{data_set=")
                .AddQuotedString(data.DataSet)
                .Add(",key=")
                .AddQuotedString(data.Key);

            if (data.Value != null)
            {
                cb.Add(",value=").Add(data.Value);
            }

            var command = cb.Add("}").Build();

            var clients = _factorioProcessHub.Clients;
            foreach (var entry in servers)
            {
                var id = entry.Key;
                var server = entry.Value;
                if (id != sourceId && server.Status == FactorioServerStatus.Running)
                {
                    try
                    {
                        await server.ServerLock.WaitAsync();
                        if (server.TrackingDataSets.Contains(dataSet))
                        {
                            _ = clients.Group(id).SendToFactorio(command);
                        }
                    }
                    finally
                    {
                        server.ServerLock.Release();
                    }
                }
            }
        }

        private async Task UpdateDataSetDb(ScenarioDataEntry data)
        {
            var db = _dbContextFactory.Create<ScenarioDbContext>();

            int retryCount = 10;
            while (retryCount >= 0)
            {
                var old = await db.ScenarioDataEntries.FirstOrDefaultAsync(x => x.DataSet == data.DataSet && x.Key == data.Key);

                try
                {
                    if (data.Value == null)
                    {
                        if (old != null)
                        {
                            db.Remove(old);
                            await db.SaveChangesAsync();
                        }
                    }
                    else
                    {
                        if (old != null)
                        {
                            db.Entry(old).Property(x => x.Value).CurrentValue = data.Value;
                        }
                        else
                        {
                            db.Add(data);
                        }
                        await db.SaveChangesAsync();
                    }

                    return;
                }
                catch (DbUpdateConcurrencyException)
                {
                    // This exception is thrown if the old entry no longer exists in the database 
                    // when trying to update it. The solution is to remove the old cached entry
                    // and try again.
                    if (old != null)
                    {
                        db.Entry(old).State = EntityState.Detached;
                    }
                    retryCount--;
                }
                catch (DbUpdateException)
                {
                    // This exception is thrown if the UNQIUE constraint fails, meaning the DataSet
                    // Key pair already exists, when adding a new entry. The solution is to remove
                    // the cached new entry so that the old entry is fetched from the database not
                    // from the cache. Then the new entry can be properly compared and updated.
                    db.Entry(data).State = EntityState.Detached;
                    retryCount--;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, nameof(UpdateDataSetDb));
                    return;
                }
            }

            _logger.LogWarning("UpdateDataSetDb failed to update data. DataSet: {DataSet}, Key: {Key}, Value: {Value}", data.DataSet, data.Key, data.Value);
        }

        private Task SendDataToWeb(ScenarioDataEntry data)
        {
            return _scenariolHub.Clients.Group(data.DataSet).SendEntry(data);
        }

        public async Task DoSetData(string serverId, string content)
        {
            ScenarioDataEntry data;
            try
            {
                data = JsonConvert.DeserializeObject<ScenarioDataEntry>(content);
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(DoSetData) + " deserialization");
                return;
            }

            var t1 = SendDataToTrackingServers(serverId, data);
            var t2 = UpdateDataSetDb(data);

            await t1;
            await t2;

            await SendDataToWeb(data);
        }

        public async Task<ScenarioDataEntry> GetScenarioData(string dataSet, string key)
        {
            if (dataSet == null || key == null)
            {
                return null;
            }

            try
            {
                var db = _dbContextFactory.Create<ScenarioDbContext>();
                return await db.ScenarioDataEntries.AsNoTracking().FirstOrDefaultAsync(x => x.DataSet == dataSet && x.Key == key);
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(GetScenarioData));
            }

            return null;
        }

        public async Task<ScenarioDataEntry[]> GetScenarioData(string dataSet)
        {
            if (dataSet == null)
            {
                return new ScenarioDataEntry[0];
            }

            try
            {
                var db = _dbContextFactory.Create<ScenarioDbContext>();
                return await db.ScenarioDataEntries.AsNoTracking().Where(x => x.DataSet == dataSet).ToArrayAsync();
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(GetScenarioData));
            }

            return new ScenarioDataEntry[0];
        }

        public async Task<ScenarioDataEntry[]> GetAllScenarioData()
        {
            try
            {
                var db = _dbContextFactory.Create<ScenarioDbContext>();
                return await db.ScenarioDataEntries.AsNoTracking().ToArrayAsync();
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(GetAllScenarioData));
            }

            return new ScenarioDataEntry[0];
        }

        public async Task<string[]> GetAllScenarioDataSets()
        {
            try
            {
                var db = _dbContextFactory.Create<ScenarioDbContext>();
                return await db.ScenarioDataEntries.Select(x => x.DataSet).Distinct().ToArrayAsync();
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(GetAllScenarioData));
            }

            return new string[0];
        }

        public async Task UpdateScenarioDataFromWeb(ScenarioDataEntry data)
        {
            if (data.DataSet == null || data.Key == null)
            {
                return;
            }

            var t1 = SendDataToTrackingServers("", data);
            var t2 = UpdateDataSetDb(data);

            await t1;
            await t2;

            await SendDataToWeb(data);
        }

        public void DoPing(string serverId, string content)
        {
            if (string.IsNullOrWhiteSpace(content))
            {
                return;
            }

            int firstSpace = content.IndexOf(' ');
            int rest = content.Length - firstSpace - 1;

            if (rest < 1)
            {
                return;
            }

            var funcToken = content.Substring(0, firstSpace);
            var data = content.Substring(firstSpace + 1, rest);

            var command = FactorioCommandBuilder
                .ServerCommand("raise_callback")
                .Add(funcToken)
                .Add(",")
                .Add(data)
                .Build();

            SendToFactorioProcess(serverId, command);
        }

        public async Task FactorioControlDataReceived(string serverId, string data, string userName)
        {
            if (string.IsNullOrWhiteSpace(data))
            {
                return;
            }

            if (data.StartsWith("/ban"))
            {
                string[] words = data.Split(' ');

                if (words.Length < 2)
                {
                    return;
                }

                string player = words[1];

                string reason;
                if (words.Length > 2)
                {
                    reason = string.Join(' ', words, 2, words.Length - 2);
                }
                else
                {
                    reason = "unspecified.";
                }

                Ban ban = new Ban()
                {
                    Username = player,
                    Reason = reason,
                    Admin = userName,
                    DateTime = DateTime.UtcNow
                };

                var command = $"/ban {player} {reason}";
                command.Substring(0, command.Length - 1);

                // /ban doesn't support names with spaces.
                if (!player.Contains(' '))
                {
                    _ = SendToFactorioProcess(serverId, command);
                }

                if (!servers.TryGetValue(serverId, out var sourceServerData))
                {
                    _logger.LogError("Unknown serverId: {serverId}", serverId);
                    return;
                }

                if (!sourceServerData.ExtraServerSettings.SyncBans)
                {
                    return;
                }

                // /ban doesn't support names with spaces.
                if (!player.Contains(' '))
                {
                    SendBanCommandToEachRunningServerExcept(command, serverId);
                }

                await AddBanToDatabase(ban);

            }
            else if (data.StartsWith("/unban"))
            {
                if (data.Length < 8)
                {
                    return;
                }

                string player = data.Substring(6).Trim();

                var command = $"/unban {player}";

                // /unban doesn't support names with spaces.
                if (!player.Contains(' '))
                {
                    _ = SendToFactorioProcess(serverId, command);
                }

                if (!servers.TryGetValue(serverId, out var sourceServerData))
                {
                    _logger.LogError("Unknown serverId: {serverId}", serverId);
                    return;
                }

                if (!sourceServerData.ExtraServerSettings.SyncBans)
                {
                    return;
                }

                // /unban doesn't support names with spaces.
                if (!player.Contains(' '))
                {
                    SendBanCommandToEachRunningServerExcept(command, serverId);
                }

                await RemoveBanFromDatabase(player, userName);
            }
            else if (data.StartsWith('/'))
            {
                await SendToFactorioProcess(serverId, data);
            }
            else
            {
                if (!servers.TryGetValue(serverId, out var sourceServerData))
                {
                    _logger.LogError("Unknown serverId: {serverId}", serverId);
                    return;
                }

                var messageData = new MessageData()
                {
                    ServerId = serverId,
                    Message = $"[Server] {userName}: {data}",
                    MessageType = MessageType.Output
                };

                try
                {
                    await sourceServerData.ServerLock.WaitAsync();
                    if (sourceServerData.Status == FactorioServerStatus.Running)
                    {
                        string message = SanitizeDiscordChat(data);
                        string command = $"/silent-command game.print('[Server] {userName}: {message}')";
                        _ = SendToFactorioProcess(serverId, command);

                        LogChat(serverId, messageData.Message, DateTime.UtcNow);
                    }
                }
                finally
                {
                    sourceServerData.ServerLock.Release();
                }

                _ = SendToFactorioControl(serverId, messageData);

                _ = _discordBotContext.SendToFactorioChannel(serverId, messageData.Message);
            }
        }

        public async Task<Result> BanPlayer(Ban ban, bool synchronizeWithServers)
        {
            List<Error> errors = new List<Error>();

            if (string.IsNullOrWhiteSpace(ban.Username))
            {
                errors.Add(new Error(Constants.RequiredFieldErrorKey, nameof(ban.Username)));
            }
            if (string.IsNullOrWhiteSpace(ban.Reason))
            {
                errors.Add(new Error(Constants.RequiredFieldErrorKey, nameof(ban.Reason)));
            }
            if (string.IsNullOrWhiteSpace(ban.Admin))
            {
                errors.Add(new Error(Constants.RequiredFieldErrorKey, nameof(ban.Admin)));
            }
            if (ban.DateTime == default)
            {
                errors.Add(new Error(Constants.RequiredFieldErrorKey, nameof(ban.DateTime)));
            }

            if (errors.Count != 0)
            {
                return Result.Failure(errors);
            }

            if (synchronizeWithServers)
            {
                // /ban doesn't support names with spaces.
                if (!ban.Username.Contains(' '))
                {
                    var command = $"/ban {ban.Username} {ban.Reason}";
                    command.Substring(0, command.Length - 1);

                    SendBanCommandToEachRunningServer(command);
                }
            }

            bool added = await AddBanToDatabase(ban);
            if (added)
            {
                return Result.OK;
            }
            else
            {
                return Result.Failure(Constants.FailedToAddBanToDatabaseErrorKey);
            }
        }

        public async Task<Result> UnBanPlayer(string username, string admin, bool synchronizeWithServers)
        {
            List<Error> errors = new List<Error>();

            if (string.IsNullOrWhiteSpace(username))
            {
                errors.Add(new Error(Constants.RequiredFieldErrorKey, nameof(username)));
            }
            if (string.IsNullOrWhiteSpace(admin))
            {
                errors.Add(new Error(Constants.RequiredFieldErrorKey, nameof(admin)));
            }

            if (errors.Count != 0)
            {
                return Result.Failure(errors);
            }

            if (synchronizeWithServers)
            {
                // /unban doesn't support names with spaces.
                if (!username.Contains(' '))
                {
                    var command = $"/unban {username}";
                    SendBanCommandToEachRunningServer(command);
                }
            }

            await RemoveBanFromDatabase(username, admin);

            return Result.OK;
        }

        private async Task<bool> AddBanToDatabase(Ban ban)
        {
            ban.Username = ban.Username.ToLowerInvariant();

            var db = _dbContextFactory.Create<ApplicationDbContext>();

            int retryCount = 10;
            while (retryCount >= 0)
            {
                var old = await db.Bans.FirstOrDefaultAsync(b => b.Username == ban.Username);

                try
                {
                    if (old == null)
                    {
                        db.Add(ban);
                    }
                    else
                    {
                        old.Admin = ban.Admin;
                        old.DateTime = ban.DateTime;
                        old.Reason = ban.Reason;
                        db.Update(old);
                    }


                    await db.SaveChangesAsync();

                    _ = _factorioBanHub.Clients.All.SendAddBan(ban);

                    _logger.LogInformation("[BAN] {username} was banned by: {admin}. Reason: {reason}", ban.Username, ban.Admin, ban.Reason);

                    return true;
                }
                catch (DbUpdateConcurrencyException)
                {
                    // This exception is thrown if the old entry no longer exists in the database 
                    // when trying to update it. The solution is to remove the old cached entry
                    // and try again.
                    if (old != null)
                    {
                        db.Entry(old).State = EntityState.Detached;
                    }
                    retryCount--;
                }
                catch (DbUpdateException)
                {
                    // This exception is thrown if the UNQIUE constraint fails, meaning the DataSet
                    // Key pair already exists, when adding a new entry. The solution is to remove
                    // the cached new entry so that the old entry is fetched from the database not
                    // from the cache. Then the new entry can be properly compared and updated.
                    db.Entry(ban).State = EntityState.Detached;
                    retryCount--;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, nameof(AddBanToDatabase));
                    return false;
                }
            }

            _logger.LogWarning("AddBanToDatabase failed to add ban: {@Ban}", ban);
            return false;
        }

        private async Task DoBan(string serverId, string content)
        {
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknown serverId: {serverId}", serverId);
                return;
            }

            if (!serverData.ExtraServerSettings.SyncBans)
            {
                return;
            }

            int index = content.IndexOf(" was banned by ");

            if (index < 0)
            {
                return;
            }

            string player = content.Substring(0, index).Trim();
            if (player.EndsWith(" (not on map)"))
            {
                player = player.Substring(0, player.Length - 13);
            }

            index = index + 15;

            if (index >= content.Length)
            {
                return;
            }

            string rest = content.Substring(index);

            string[] words = rest.Split(' ');
            if (words.Length < 2)
            {
                return;
            }

            string admin = words[0];

            if (admin == "<server>.")
            {
                return;
            }

            int reasonIndex = 1;

            // If the admin has a tag, that will appear after their name.
            if (words[reasonIndex] == "Reason:")
            {
                // case no tag, remove '.' at end of name.
                admin = admin.Substring(0, admin.Length - 1);
            }
            else
            {
                // case tag, keep going utill we find 'Reason:'
                do
                {
                    reasonIndex++;
                    if (reasonIndex >= words.Length)
                    {
                        return;
                    }
                } while (words[reasonIndex] != "Reason:");
            }

            reasonIndex += 1;
            string reason = string.Join(' ', words, reasonIndex, words.Length - reasonIndex);

            // /ban doesn't support names with spaces.
            if (!player.Contains(' '))
            {
                var command = $"/ban {player} {reason}";
                command.Substring(0, command.Length - 1);

                SendBanCommandToEachRunningServerExcept(command, serverId);
            }

            if (reason.EndsWith(".."))
            {
                reason = reason.Substring(0, reason.Length - 1);
            }

            var ban = new Ban()
            {
                Username = player,
                Admin = admin,
                Reason = reason,
                DateTime = DateTime.UtcNow
            };

            await AddBanToDatabase(ban);
        }

        private async Task DoSyncBan(string serverId, string content)
        {
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknown serverId: {serverId}", serverId);
                return;
            }

            if (!serverData.ExtraServerSettings.SyncBans)
            {
                return;
            }

            Ban ban;
            try
            {
                ban = JsonConvert.DeserializeObject<Ban>(content);
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(DoSyncBan) + " deserialization");
                return;
            }

            if (string.IsNullOrWhiteSpace(ban.Username))
            {
                return;
            }

            if (string.IsNullOrWhiteSpace(ban.Admin))
            {
                ban.Admin = "<script>";
            }

            ban.DateTime = DateTime.UtcNow;

            // /ban doesn't support names with spaces.
            if (!ban.Username.Contains(' '))
            {
                var command = $"/ban {ban.Username} {ban.Reason}";
                command.Substring(0, command.Length - 1);

                SendBanCommandToEachRunningServerExcept(command, serverId);
            }

            await AddBanToDatabase(ban);
        }

        private async Task RemoveBanFromDatabase(string username, string admin)
        {
            try
            {
                var db = _dbContextFactory.Create<ApplicationDbContext>();

                var old = await db.Bans.SingleOrDefaultAsync(b => b.Username == username);
                if (old == null)
                {
                    return;
                }

                db.Bans.Remove(old);
                await db.SaveChangesAsync();

                _ = _factorioBanHub.Clients.All.SendRemoveBan(username);

                _logger.LogInformation("[UNBAN] {username} was unbanned by: {admin}", username, admin);
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(DoBan));
            }
        }

        private async Task DoUnBan(string serverId, string content)
        {
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknown serverId: {serverId}", serverId);
                return;
            }

            if (!serverData.ExtraServerSettings.SyncBans)
            {
                return;
            }

            int index = content.IndexOf(" was unbanned by ");

            if (index < 0)
            {
                return;
            }

            string player = content.Substring(0, index).Trim();
            string admin = content.Substring(index + 17).Trim();

            if (admin == "<server>.")
            {
                return;
            }

            // /unban doesn't support names with spaces.
            if (!player.Contains(' '))
            {
                var command = $"/unban {player}";
                SendBanCommandToEachRunningServerExcept(command, serverId);
            }

            await RemoveBanFromDatabase(player, admin);
        }

        private async Task DoUnBannedSync(string serverId, string content)
        {
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknown serverId: {serverId}", serverId);
                return;
            }

            if (!serverData.ExtraServerSettings.SyncBans)
            {
                return;
            }

            Ban ban;
            try
            {
                ban = JsonConvert.DeserializeObject<Ban>(content);
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(DoUnBannedSync) + " deserialization");
                return;
            }

            if (string.IsNullOrWhiteSpace(ban.Username))
            {
                return;
            }

            if (string.IsNullOrWhiteSpace(ban.Admin))
            {
                ban.Admin = "<script>";
            }

            // /unban doesn't support names with spaces.
            if (!ban.Username.Contains(' '))
            {
                var command = $"/unban {ban.Username}";
                SendBanCommandToEachRunningServerExcept(command, serverId);
            }

            await RemoveBanFromDatabase(ban.Username, ban.Admin);
        }

        public void FactorioWrapperDataReceived(string serverId, string data, DateTime dateTime)
        {
            var messageData = new MessageData()
            {
                ServerId = serverId,
                MessageType = MessageType.Wrapper,
                Message = data
            };

            _ = SendToFactorioControl(serverId, messageData);
        }

        private async Task ServerStarted(FactorioServerData serverData, DateTime dateTime)
        {
            var serverId = serverData.ServerId;

            var t1 = SendToFactorioProcess(serverId, FactorioCommandBuilder.Static.server_started);

            var embed = new DiscordEmbedBuilder()
            {
                Title = "Status:",
                Description = "Server has **started**",
                Color = DiscordBot.successColor,
                Timestamp = DateTimeOffset.UtcNow
            };
            var t2 = _discordBotContext.SendEmbedToFactorioChannel(serverId, embed);

            string name = null;
            if (serverData.ExtraServerSettings.SetDiscordChannelName)
            {
                name = $"s{serverId}-{serverData.ServerSettings.Name} {serverData.Version.Replace('.', '_')}";
            }
            var t3 = _discordBotContext.SetChannelNameAndTopic(serverData.ServerId, name: name, topic: "Players online 0");

            LogChat(serverId, "[SERVER-STARTED]", dateTime);

            await t1;
            await ServerConnected(serverData);
            await t2;
            await t3;
        }

        private async Task ServerConnected(FactorioServerData serverData)
        {
            var serverId = serverData.ServerId;
            var client = _factorioProcessHub.Clients.Group(serverId);

            await client.SendToFactorio(FactorioCommandBuilder.Static.get_tracked_data_sets);
            await client.SendToFactorio(FactorioCommandBuilder.Static.query_online_players);
        }

        private async Task DoStoppedCallback(FactorioServerData serverData)
        {
            try
            {
                await serverData.ServerLock.WaitAsync();

                var callback = serverData.StopCallback;
                serverData.StopCallback = null;

                if (callback == null)
                {
                    return;
                }

                await callback();
            }
            finally
            {
                serverData.ServerLock.Release();
            }
        }

        private async Task MarkChannelOffline(FactorioServerData serverData)
        {
            string serverId = serverData.ServerId;

            string name = null;
            if (serverData.ExtraServerSettings.SetDiscordChannelName)
            {
                name = $"s{serverId}-offline";
            }

            await _discordBotContext.SetChannelNameAndTopic(serverId, name: name, topic: "Server offline");
        }

        public async Task StatusChanged(string serverId, FactorioServerStatus newStatus, FactorioServerStatus oldStatus, DateTime dateTime)
        {
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknown serverId: {serverId}", serverId);
                return;
            }

            FactorioServerStatus recordedOldStatus;
            try
            {
                await serverData.ServerLock.WaitAsync();

                recordedOldStatus = serverData.Status;

                if (newStatus != recordedOldStatus)
                {
                    serverData.Status = newStatus;
                }
            }
            finally
            {
                serverData.ServerLock.Release();
            }

            Task discordTask = null;

            if (oldStatus == FactorioServerStatus.Starting && newStatus == FactorioServerStatus.Running)
            {
                discordTask = ServerStarted(serverData, dateTime);
            }
            else if (newStatus == FactorioServerStatus.Running && recordedOldStatus != FactorioServerStatus.Running)
            {
                discordTask = ServerConnected(serverData);
            }
            else if (oldStatus == FactorioServerStatus.Stopping && newStatus == FactorioServerStatus.Stopped
                || oldStatus == FactorioServerStatus.Killing && newStatus == FactorioServerStatus.Killed)
            {
                var embed = new DiscordEmbedBuilder()
                {
                    Title = "Status:",
                    Description = "Server has **stopped**",
                    Color = DiscordBot.infoColor,
                    Timestamp = DateTimeOffset.UtcNow
                };
                discordTask = _discordBotContext.SendEmbedToFactorioChannel(serverId, embed);

                _ = MarkChannelOffline(serverData);

                LogChat(serverId, "[SERVER-STOPPED]", dateTime);

                try
                {
                    await serverData.ServerLock.WaitAsync();

                    var logger = serverData.ChatLogger;
                    if (logger != null)
                    {
                        logger.Dispose();
                        serverData.ChatLogger = null;
                    }
                }
                finally
                {
                    serverData.ServerLock.Release();
                }

                await DoStoppedCallback(serverData);
            }
            else if (newStatus == FactorioServerStatus.Crashed && oldStatus != FactorioServerStatus.Crashed)
            {
                var embed = new DiscordEmbedBuilder()
                {
                    Title = "Status:",
                    Description = "Server has **crashed**",
                    Color = DiscordBot.failureColor,
                    Timestamp = DateTimeOffset.UtcNow
                };
                discordTask = _discordBotContext.SendEmbedToFactorioChannel(serverId, embed);
                _ = MarkChannelOffline(serverData);

                LogChat(serverId, "[SERVER-CRASHED]", dateTime);

                try
                {
                    await serverData.ServerLock.WaitAsync();

                    var logger = serverData.ChatLogger;
                    if (logger != null)
                    {
                        logger.Dispose();
                        serverData.ChatLogger = null;
                    }
                }
                finally
                {
                    serverData.ServerLock.Release();
                }
            }

            var groups = _factorioControlHub.Clients.Group(serverId);
            Task contorlTask1 = groups.FactorioStatusChanged(newStatus.ToString(), oldStatus.ToString());

            Task controlTask2 = null;
            if (newStatus != oldStatus)
            {
                var messageData = new MessageData()
                {
                    ServerId = serverId,
                    MessageType = MessageType.Status,
                    Message = $"[STATUS]: Changed from {oldStatus} to {newStatus}"
                };

                serverData.ControlMessageBuffer.Add(messageData);
                controlTask2 = groups.SendMessage(messageData);
            }

            if (discordTask != null)
                await discordTask;
            if (contorlTask1 != null)
                await contorlTask1;
            if (controlTask2 != null)
                await controlTask2;
        }

        public async Task<List<Ban>> GetBansAsync()
        {
            var db = _dbContextFactory.Create<ApplicationDbContext>();
            return await db.Bans.AsNoTracking().ToListAsync();
        }

        public async Task<List<string>> GetBanUserNamesAsync()
        {
            var db = _dbContextFactory.Create<ApplicationDbContext>();
            return await db.Bans
                .AsNoTracking()
                .Select(x => x.Username)
                .OrderBy(x => x.ToLowerInvariant())
                .ToListAsync();
        }

        public async Task<List<Admin>> GetAdminsAsync()
        {
            var db = _dbContextFactory.Create<ApplicationDbContext>();
            return await db.Admins.ToListAsync();
        }

        public async Task AddAdminsFromStringAsync(string data)
        {
            try
            {
                var db = _dbContextFactory.Create<ApplicationDbContext>();
                var admins = db.Admins;

                var names = data.Split(',').Select(x => x.Trim());
                foreach (var name in names)
                {
                    if (admins.Any(a => a.Name == name))
                    {
                        continue;
                    }

                    admins.Add(new Admin() { Name = name });
                }

                await db.SaveChangesAsync();
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(AddAdminsFromStringAsync));
            }
        }

        public async Task RemoveAdmin(string name)
        {
            try
            {
                var db = _dbContextFactory.Create<ApplicationDbContext>();
                var admins = db.Admins;

                var admin = await admins.SingleOrDefaultAsync(a => a.Name == name);
                if (admin != null)
                {
                    admins.Remove(admin);
                    await db.SaveChangesAsync();
                }
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(RemoveAdmin));
            }
        }

        public Task OnProcessRegistered(string serverId)
        {
            return _factorioProcessHub.Clients.Group(serverId).GetStatus();
        }

        private FileMetaData[] GetFilesMetaData(string path, string directory)
        {
            try
            {
                var di = new DirectoryInfo(path);
                if (!di.Exists)
                {
                    di.Create();
                }

                var files = di.EnumerateFiles("*.zip")
                    .Select(f => new FileMetaData()
                    {
                        Name = f.Name,
                        Directory = directory,
                        CreatedTime = f.CreationTimeUtc,
                        LastModifiedTime = f.LastWriteTimeUtc,
                        Size = f.Length
                    })
                    .ToArray();

                return files;
            }
            catch (Exception e)
            {
                _logger.LogError(e.ToString());
                return new FileMetaData[0];
            }
        }

        public FileMetaData[] GetTempSaveFiles(string serverId)
        {
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknown serverId: {serverId}", serverId);
                return new FileMetaData[0];
            }

            var path = serverData.TempSavesDirectoryPath;
            var dir = Path.Combine(serverId, Constants.TempSavesDirectoryName);

            return GetFilesMetaData(path, dir);
        }

        public FileMetaData[] GetLocalSaveFiles(string serverId)
        {
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknown serverId: {serverId}", serverId);
                return new FileMetaData[0];
            }

            var path = serverData.LocalSavesDirectoroyPath;
            var dir = Path.Combine(serverId, Constants.LocalSavesDirectoryName);

            return GetFilesMetaData(path, dir);
        }

        public FileMetaData[] GetGlobalSaveFiles()
        {
            var path = FactorioServerData.GlobalSavesDirectoryPath;

            return GetFilesMetaData(path, Constants.GlobalSavesDirectoryName);
        }

        public List<FileMetaData> GetLogs(string serverId)
        {
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknown serverId: {serverId}", serverId);
                return new List<FileMetaData>();
            }

            List<FileMetaData> logs = new List<FileMetaData>();

            var currentLog = new FileInfo(serverData.CurrentLogPath);
            if (currentLog.Exists)
            {
                logs.Add(new FileMetaData()
                {
                    Name = currentLog.Name,
                    CreatedTime = currentLog.CreationTimeUtc,
                    LastModifiedTime = currentLog.LastWriteTimeUtc,
                    Directory = Path.Combine(serverId),
                    Size = currentLog.Length
                });
            }

            var logsDir = new DirectoryInfo(serverData.LogsDirectoryPath);
            if (logsDir.Exists)
            {
                var logfiles = logsDir.EnumerateFiles("*.log")
                    .Select(x => new FileMetaData()
                    {
                        Name = x.Name,
                        CreatedTime = x.CreationTimeUtc,
                        LastModifiedTime = x.LastWriteTimeUtc,
                        Directory = Path.Combine(serverId, Constants.LogDirectoryName),
                        Size = x.Length
                    })
                    .OrderByDescending(x => x.CreatedTime);

                logs.AddRange(logfiles);
            }

            return logs;
        }

        public List<FileMetaData> GetChatLogs(string serverId)
        {
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknown serverId: {serverId}", serverId);
                return new List<FileMetaData>();
            }

            List<FileMetaData> logs = new List<FileMetaData>();

            var logsDir = new DirectoryInfo(serverData.ChatLogsDirectoryPath);
            if (logsDir.Exists)
            {
                var logfiles = logsDir.EnumerateFiles("*.log")
                    .Select(x => new FileMetaData()
                    {
                        Name = x.Name,
                        CreatedTime = x.CreationTimeUtc,
                        LastModifiedTime = x.LastWriteTimeUtc,
                        Directory = Path.Combine(serverId, Constants.ChatLogDirectoryName),
                        Size = x.Length
                    })
                    .OrderByDescending(x => x.CreatedTime);

                logs.AddRange(logfiles);
            }

            return logs;
        }

        public FileInfo GetLogFile(string directoryName, string fileName)
        {
            string safeFileName = Path.GetFileName(fileName);
            string path = Path.Combine(FactorioServerData.baseDirectoryPath, directoryName, safeFileName);
            path = Path.GetFullPath(path);

            if (!path.StartsWith(FactorioServerData.baseDirectoryPath))
            {
                return null;
            }

            var file = new FileInfo(path);
            if (!file.Exists)
            {
                return null;
            }

            if (file.Extension != ".log")
            {
                return null;
            }

            if (file.Directory.Name == Constants.LogDirectoryName)
            {
                return file;
            }
            else if (file.Name == Constants.CurrentLogFileName)
            {
                return file;
            }
            else
            {
                return null;
            }
        }

        public FileInfo GetChatLogFile(string directoryName, string fileName)
        {
            string safeFileName = Path.GetFileName(fileName);
            string path = Path.Combine(FactorioServerData.baseDirectoryPath, directoryName, safeFileName);
            path = Path.GetFullPath(path);

            if (!path.StartsWith(FactorioServerData.baseDirectoryPath))
            {
                return null;
            }

            var file = new FileInfo(path);
            if (!file.Exists)
            {
                return null;
            }

            if (file.Extension != ".log")
            {
                return null;
            }

            if (file.Directory.Name == Constants.ChatLogDirectoryName)
            {
                return file;
            }
            else
            {
                return null;
            }
        }

        private bool IsSaveDirectory(string dirName)
        {
            switch (dirName)
            {
                case Constants.GlobalSavesDirectoryName:
                case Constants.LocalSavesDirectoryName:
                case Constants.TempSavesDirectoryName:
                    return true;
                default:
                    return false;
            }
        }

        private DirectoryInfo GetSaveDirectory(string dirName)
        {
            try
            {
                if (FactorioServerData.ValidSaveDirectories.Contains(dirName))
                {
                    var dirPath = Path.Combine(FactorioServerData.baseDirectoryPath, dirName);
                    dirPath = Path.GetFullPath(dirPath);

                    if (!dirPath.StartsWith(FactorioServerData.baseDirectoryPath))
                        return null;

                    var dir = new DirectoryInfo(dirPath);
                    if (!dir.Exists)
                    {
                        dir.Create();
                    }

                    return dir;
                }
                else
                {
                    return null;
                }
            }
            catch (Exception)
            {
                return null;
            }
        }

        private string SafeFilePath(string dirPath, string fileName)
        {
            fileName = Path.GetFileName(fileName);
            string path = Path.Combine(dirPath, fileName);
            path = Path.GetFullPath(path);

            if (!path.StartsWith(FactorioServerData.baseDirectoryPath))
            {
                return null;
            }

            return path;
        }

        public FileInfo GetSaveFile(string directoryName, string fileName)
        {
            var directory = GetSaveDirectory(directoryName);

            if (directory == null)
            {
                return null;
            }

            string path = SafeFilePath(directory.FullName, fileName);
            if (path == null)
            {
                return null;
            }

            if (Path.GetExtension(fileName) != ".zip")
            {
                return null;
            }

            try
            {
                FileInfo fi = new FileInfo(path);
                if (fi.Exists)
                {
                    return fi;
                }
                else
                {
                    return null;
                }
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(GetSaveFile));
                return null;
            }
        }

        public async Task<Result> UploadFiles(string directoryName, IList<IFormFile> files)
        {
            var directory = GetSaveDirectory(directoryName);

            if (directory == null)
            {
                return Result.Failure(new Error(Constants.InvalidDirectoryErrorKey, directoryName));
            }

            var errors = new List<Error>();

            foreach (var file in files)
            {
                if (string.IsNullOrWhiteSpace(file.FileName))
                {
                    errors.Add(new Error(Constants.InvalidFileNameErrorKey, file.FileName ?? ""));
                    continue;
                }
                if (file.FileName.Contains(" "))
                {
                    errors.Add(new Error(Constants.InvalidFileNameErrorKey, $"name {file.FileName} cannot contain spaces."));
                    continue;
                }

                string path = SafeFilePath(directory.FullName, file.FileName);
                if (path == null)
                {
                    errors.Add(new Error(Constants.FileErrorKey, $"Error uploading {file.FileName}."));
                    continue;
                }

                try
                {
                    var fi = new FileInfo(path);

                    if (fi.Exists)
                    {
                        errors.Add(new Error(Constants.FileAlreadyExistsErrorKey, $"{file.FileName} already exists."));
                        continue;
                    }

                    using (var writeStream = fi.OpenWrite())
                    using (var readStream = file.OpenReadStream())
                    {
                        await readStream.CopyToAsync(writeStream);
                    }
                }
                catch (Exception e)
                {
                    _logger.LogError("Error Uploading file.", e);
                    errors.Add(new Error(Constants.FileErrorKey, $"Error uploading {file.FileName}."));
                }
            }

            if (errors.Count != 0)
            {
                return Result.Failure(errors);
            }
            else
            {
                return Result.OK;
            }
        }

        public Result DeleteFiles(List<string> filePaths)
        {
            var errors = new List<Error>();

            foreach (string filePath in filePaths)
            {
                var dirName = Path.GetDirectoryName(filePath);
                var dir = GetSaveDirectory(dirName);

                if (dir == null)
                {
                    errors.Add(new Error(Constants.InvalidDirectoryErrorKey, dirName));
                    continue;
                }

                string path = SafeFilePath(dir.FullName, filePath);
                if (path == null)
                {
                    errors.Add(new Error(Constants.FileErrorKey, $"Error deleting {filePath}."));
                    continue;
                }

                try
                {
                    var fi = new FileInfo(path);

                    if (!fi.Exists)
                    {
                        errors.Add(new Error(Constants.MissingFileErrorKey, $"{filePath} doesn't exists."));
                        continue;
                    }

                    fi.Delete();
                }
                catch (Exception e)
                {
                    _logger.LogError("Error Deleting file.", e);
                    errors.Add(new Error(Constants.FileErrorKey, $"Error deleting {filePath}."));
                }
            }

            if (errors.Count != 0)
            {
                return Result.Failure(errors);
            }
            else
            {
                return Result.OK;
            }
        }

        public Result MoveFiles(string destination, List<string> filePaths)
        {
            string targetDirPath = Path.Combine(FactorioServerData.baseDirectoryPath, destination);

            var targetDir = GetSaveDirectory(destination);
            if (targetDir == null)
            {
                return Result.Failure(new Error(Constants.InvalidDirectoryErrorKey, destination));
            }

            var errors = new List<Error>();

            foreach (var filePath in filePaths)
            {
                var sourceDirName = Path.GetDirectoryName(filePath);
                var sourceDir = GetSaveDirectory(sourceDirName);

                if (sourceDir == null)
                {
                    errors.Add(new Error(Constants.InvalidDirectoryErrorKey, sourceDirName));
                    continue;
                }

                string sourceFullPath = SafeFilePath(sourceDir.FullName, filePath);
                if (sourceFullPath == null)
                {
                    errors.Add(new Error(Constants.FileErrorKey, $"Error moveing {filePath}."));
                    continue;
                }

                try
                {
                    var sourceFile = new FileInfo(sourceFullPath);

                    if (!sourceFile.Exists)
                    {
                        errors.Add(new Error(Constants.MissingFileErrorKey, $"{filePath} doesn't exists."));
                        continue;
                    }

                    string destinationFilePath = Path.Combine(targetDir.FullName, sourceFile.Name);

                    var destinationFileInfo = new FileInfo(destinationFilePath);

                    if (destinationFileInfo.Exists)
                    {
                        errors.Add(new Error(Constants.FileAlreadyExistsErrorKey, $"{destination}/{filePath} already exists."));
                        continue;
                    }

                    sourceFile.MoveTo(destinationFilePath);
                }
                catch (Exception e)
                {
                    _logger.LogError("Error moveing file.", e);
                    errors.Add(new Error(Constants.FileErrorKey, $"Error moveing {filePath}."));
                }
            }

            if (errors.Count != 0)
            {
                return Result.Failure(errors);
            }
            else
            {
                return Result.OK;
            }
        }

        public async Task<Result> CopyFiles(string destination, List<string> filePaths)
        {
            string targetDirPath = Path.Combine(FactorioServerData.baseDirectoryPath, destination);

            var targetDir = GetSaveDirectory(destination);
            if (targetDir == null)
            {
                return Result.Failure(new Error(Constants.InvalidDirectoryErrorKey, destination));
            }

            var errors = new List<Error>();

            foreach (var filePath in filePaths)
            {
                var sourceDirName = Path.GetDirectoryName(filePath);
                var sourceDir = GetSaveDirectory(sourceDirName);

                if (sourceDir == null)
                {
                    errors.Add(new Error(Constants.InvalidDirectoryErrorKey, sourceDirName));
                    continue;
                }

                string sourceFullPath = SafeFilePath(sourceDir.FullName, filePath);
                if (sourceFullPath == null)
                {
                    errors.Add(new Error(Constants.FileErrorKey, $"Error coppying {filePath}."));
                    continue;
                }

                try
                {
                    var sourceFile = new FileInfo(sourceFullPath);

                    if (!sourceFile.Exists)
                    {
                        errors.Add(new Error(Constants.MissingFileErrorKey, $"{filePath} doesn't exists."));
                        continue;
                    }

                    string destinationFilePath = Path.Combine(targetDir.FullName, sourceFile.Name);

                    var destinationFileInfo = new FileInfo(destinationFilePath);

                    if (destinationFileInfo.Exists)
                    {
                        errors.Add(new Error(Constants.FileAlreadyExistsErrorKey, $"{destination}/{filePath} already exists."));
                        continue;
                    }


                    await sourceFile.CopyToAsync(destinationFileInfo);
                    destinationFileInfo.LastWriteTimeUtc = sourceFile.LastWriteTimeUtc;
                }
                catch (Exception e)
                {
                    _logger.LogError("Error copying file.", e);
                    errors.Add(new Error(Constants.FileErrorKey, $"Error coppying {filePath}."));
                }
            }

            if (errors.Count != 0)
            {
                return Result.Failure(errors);
            }
            else
            {
                return Result.OK;
            }
        }

        public ScenarioMetaData[] GetScenarios()
        {
            try
            {
                var dir = new DirectoryInfo(FactorioServerData.ScenarioDirectoryPath);
                if (!dir.Exists)
                {
                    dir.Create();
                }

                return dir.EnumerateDirectories().Select(d =>
                    new ScenarioMetaData()
                    {
                        Name = d.Name,
                        CreatedTime = d.CreationTimeUtc,
                        LastModifiedTime = d.LastWriteTimeUtc
                    }
                ).ToArray();
            }
            catch (Exception e)
            {
                _logger.LogError(e.ToString());
                return new ScenarioMetaData[0];
            }
        }

        public Result RenameFile(string directoryPath, string fileName, string newFileName = "")
        {
            if (string.IsNullOrWhiteSpace(newFileName))
            {
                return Result.Failure(Constants.InvalidFileNameErrorKey, newFileName);
            }
            if (newFileName.Contains(" "))
            {
                return Result.Failure(Constants.InvalidFileNameErrorKey, $"name { newFileName} cannot contain spaces.");
            }

            var directory = GetSaveDirectory(directoryPath);

            if (directory == null)
            {
                return Result.Failure(new Error(Constants.InvalidDirectoryErrorKey, directoryPath));
            }

            try
            {
                string actualFileName = Path.GetFileName(fileName);

                if (actualFileName != fileName)
                {
                    return Result.Failure(Constants.FileErrorKey, $"Invalid file name {fileName}");
                }

                string actualNewFileName = Path.GetFileName(newFileName);

                if (actualNewFileName != newFileName)
                {
                    return Result.Failure(Constants.FileErrorKey, $"Invalid file name {newFileName}");
                }


                string filePath = Path.Combine(directory.FullName, fileName);
                var fileInfo = new FileInfo(filePath);

                if (!fileInfo.Exists)
                {
                    return Result.Failure(Constants.MissingFileErrorKey, $"File {fileName} doesn't exist.");
                }

                string newFilePath = Path.Combine(directory.FullName, newFileName);
                if (Path.GetExtension(newFilePath) != ".zip")
                {
                    newFilePath += ".zip";
                }

                var newFileInfo = new FileInfo(newFilePath);

                if (newFileInfo.Exists)
                {
                    return Result.Failure(Constants.FileAlreadyExistsErrorKey, $"File {fileName} already exists.");
                }

                fileInfo.MoveTo(newFilePath);

                return Result.OK;
            }
            catch (Exception e)
            {
                _logger.LogError("Error renaming file.", e);
                return Result.Failure(Constants.FileErrorKey, $"Error renaming files");
            }
        }

        private async Task<FactorioServerSettings> GetServerSettings(FactorioServerData serverData)
        {
            var serverSettings = serverData.ServerSettings;

            if (serverSettings != null)
            {
                return serverSettings;
            }

            var fi = new FileInfo(serverData.ServerSettingsPath);

            if (!fi.Exists)
            {
                serverSettings = FactorioServerSettings.MakeDefault(_configuration);

                serverData.ServerSettings = serverSettings;

                var data = JsonConvert.SerializeObject(serverSettings, Formatting.Indented);
                using (var fs = fi.CreateText())
                {
                    await fs.WriteAsync(data);
                    await fs.FlushAsync();
                }
            }
            else
            {
                using (var s = fi.OpenText())
                {
                    string output = await s.ReadToEndAsync();
                    serverSettings = JsonConvert.DeserializeObject<FactorioServerSettings>(output);
                }

                serverData.ServerSettings = serverSettings;
            }

            return serverSettings;
        }

        private async Task<List<string>> GetServerAdminList(FactorioServerData serverData)
        {
            var adminList = serverData.ServerAdminList;

            if (adminList != null)
            {
                return adminList;
            }

            var a = await GetAdminsAsync();
            adminList = a.Select(x => x.Name).ToList();

            serverData.ServerAdminList = adminList;

            var fi = new FileInfo(serverData.ServerAdminListPath);

            if (!fi.Exists)
            {
                var data = JsonConvert.SerializeObject(adminList, Formatting.Indented);
                using (var fs = fi.CreateText())
                {
                    await fs.WriteAsync(data);
                    await fs.FlushAsync();
                }
            }

            return adminList;
        }

        public async Task<FactorioServerSettingsWebEditable> GetEditableServerSettings(string serverId)
        {
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknown serverId: {serverId}", serverId);
                return null;
            }

            try
            {
                await serverData.ServerLock.WaitAsync();

                var serverSettings = await GetServerSettings(serverData);
                var adminList = await GetServerAdminList(serverData);

                var editableSettings = new FactorioServerSettingsWebEditable()
                {
                    Name = serverSettings.Name,
                    Description = serverSettings.Description,
                    Tags = serverSettings.Tags,
                    MaxPlayers = serverSettings.MaxPlayers,
                    GamePassword = serverSettings.GamePassword,
                    MaxUploadSlots = serverSettings.MaxUploadSlots,
                    AutoPause = serverSettings.AutoPause,
                    UseDefaultAdmins = serverSettings.UseDefaultAdmins,
                    Admins = adminList,
                    AutosaveInterval = serverSettings.AutosaveInterval,
                    AutosaveSlots = serverSettings.AutosaveSlots,
                    NonBlockingSaving = serverSettings.NonBlockingSaving,
                    PublicVisible = serverSettings.Visibility.Public
                };

                return editableSettings;
            }
            finally
            {
                serverData.ServerLock.Release();
            }
        }

        public async Task<Result> SaveEditableServerSettings(string serverId, FactorioServerSettingsWebEditable settings)
        {
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknown serverId: {serverId}", serverId);
                return null;
            }

            try
            {
                await serverData.ServerLock.WaitAsync();

                var serverSettigns = await GetServerSettings(serverData);

                serverSettigns.Name = settings.Name;
                serverSettigns.Description = settings.Description;
                serverSettigns.Tags = settings.Tags.Select(x => x.Replace(' ', '\u00a0')).ToList(); // \u00a0 is &nbsp;. Factorio splits tags on space, but not on &nbsp;.
                serverSettigns.MaxPlayers = settings.MaxPlayers < 0 ? 0 : settings.MaxPlayers;
                serverSettigns.GamePassword = settings.GamePassword;
                serverSettigns.MaxUploadSlots = settings.MaxUploadSlots < 0 ? 0 : settings.MaxUploadSlots;
                serverSettigns.AutoPause = settings.AutoPause;
                serverSettigns.UseDefaultAdmins = settings.UseDefaultAdmins;
                serverSettigns.AutosaveSlots = settings.AutosaveSlots < 0 ? 0 : settings.AutosaveSlots;
                serverSettigns.AutosaveInterval = settings.AutosaveInterval < 1 ? 1 : settings.AutosaveInterval;
                serverSettigns.NonBlockingSaving = settings.NonBlockingSaving;
                serverSettigns.Visibility.Public = settings.PublicVisible;

                List<string> admins;

                if (!settings.UseDefaultAdmins)
                {
                    admins = settings.Admins.Select(x => x.Trim())
                        .Where(x => !string.IsNullOrWhiteSpace(x))
                        .ToList();
                }
                else
                {
                    var a = await GetAdminsAsync();
                    admins = a.Select(x => x.Name).ToList();
                }

                serverData.ServerAdminList = admins;

                var settingsData = JsonConvert.SerializeObject(serverSettigns, Formatting.Indented);
                var adminData = JsonConvert.SerializeObject(admins, Formatting.Indented);

                await File.WriteAllTextAsync(serverData.ServerSettingsPath, settingsData);
                await File.WriteAllTextAsync(serverData.ServerAdminListPath, adminData);

                return Result.OK;
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Exception saving server settings.");
                return Result.Failure(Constants.UnexpctedErrorKey);
            }
            finally
            {
                serverData.ServerLock.Release();
            }
        }

        public async Task<FactorioServerExtraSettings> GetExtraServerSettings(string serverId)
        {
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknown serverId: {serverId}", serverId);
                return null;
            }

            try
            {
                await serverData.ServerLock.WaitAsync();

                return serverData.ExtraServerSettings.Copy();
            }
            finally
            {
                serverData.ServerLock.Release();
            }
        }

        public async Task<Result> SaveExtraServerSettings(string serverId, FactorioServerExtraSettings settings)
        {
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknown serverId: {serverId}", serverId);
                return null;
            }

            try
            {
                await serverData.ServerLock.WaitAsync();
                serverData.ExtraServerSettings = settings;

                string data = JsonConvert.SerializeObject(settings, Formatting.Indented);
                await File.WriteAllTextAsync(serverData.ServerExtraSettingsPath, data);

                return Result.OK;
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Exception saving server extra settings.");
                return Result.Failure(Constants.UnexpctedErrorKey);
            }
            finally
            {
                serverData.ServerLock.Release();
            }
        }

        public Result DeflateSave(string connectionId, string directoryPath, string fileName, string newFileName = "")
        {
            var directory = GetSaveDirectory(directoryPath);

            if (directory == null)
            {
                return Result.Failure(new Error(Constants.InvalidDirectoryErrorKey, directoryPath));
            }

            try
            {
                string actualFileName = Path.GetFileName(fileName);

                if (actualFileName != fileName)
                {
                    return Result.Failure(Constants.FileErrorKey, $"Invalid file name {fileName}");
                }

                if (string.IsNullOrWhiteSpace(newFileName))
                {
                    newFileName = Path.GetFileNameWithoutExtension(actualFileName) + "-deflated";
                }

                if (newFileName.Contains(" "))
                {
                    return Result.Failure(Constants.InvalidFileNameErrorKey, $"name { newFileName} cannot contain spaces.");
                }

                string actualNewFileName = Path.GetFileName(newFileName);

                if (actualNewFileName != newFileName)
                {
                    return Result.Failure(Constants.FileErrorKey, $"Invalid file name {newFileName}");
                }

                string filePath = Path.Combine(directory.FullName, fileName);
                var fileInfo = new FileInfo(filePath);

                if (!fileInfo.Exists)
                {
                    return Result.Failure(Constants.MissingFileErrorKey, $"File {fileName} doesn't exist.");
                }

                string newFilePath = Path.Combine(directory.FullName, newFileName);
                if (Path.GetExtension(newFilePath) != ".zip")
                {
                    newFilePath += ".zip";
                }

                var newFileInfo = new FileInfo(newFilePath);

                if (newFileInfo.Exists)
                {
                    return Result.Failure(Constants.FileAlreadyExistsErrorKey, $"File {newFileInfo.Name} already exists.");
                }

                Task.Run(() =>
                {
                    try
                    {
                        fileInfo.CopyTo(newFilePath);

                        var deflater = new SaveDeflater();
                        deflater.Deflate(newFilePath);

                        _factorioControlHub.Clients.Clients(connectionId).DeflateFinished(Result.OK);
                    }
                    catch (Exception e)
                    {
                        _logger.LogError("Error deflating file.", e);
                        _factorioControlHub.Clients.Clients(connectionId).DeflateFinished(Result.Failure(Constants.FileErrorKey, $"Error deflating files"));
                    }
                });

                return Result.OK;
            }
            catch (Exception e)
            {
                _logger.LogError("Error deflating file.", e);
                return Result.Failure(Constants.FileErrorKey, $"Error deflating files");
            }
        }

        public Task<List<string>> GetDownloadableVersions()
        {
            return _factorioUpdater.GetDownloadableVersions();
        }

        public Task<List<string>> GetCachedVersions()
        {
            return Task.FromResult(_factorioUpdater.GetCachedVersions());
        }

        public bool DeleteCachedVersion(string version)
        {
            return _factorioUpdater.DeleteCachedFile(version);
        }

        public string GetVersion(string serverId)
        {
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknown serverId: {serverId}", serverId);
                return "";
            }

            return serverData.Version;
        }

        private void LogChat(string serverId, string content, DateTime dateTime)
        {
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknown serverId: {serverId}", serverId);
                return;
            }

            var logger = serverData.ChatLogger;

            if (logger != null)
            {
                serverData.ChatLogger.Information("{dateTime} {content}", dateTime.ToString("yyyy-MM-dd HH:mm:ss"), content);
                return;
            }

            Task.Run(async () =>
            {
                try
                {
                    await serverData.ServerLock.WaitAsync();

                    logger = serverData.ChatLogger;
                    if (logger != null)
                    {
                        serverData.ChatLogger.Information("{dateTime} {content}", dateTime.ToString("yyyy-MM-dd HH:mm:ss"), content);
                        return;
                    }

                    serverData.BuildChatLogger();
                    serverData.ChatLogger.Information("{dateTime} {content}", dateTime.ToString("yyyy-MM-dd HH:mm:ss"), content);
                }
                finally
                {
                    serverData.ServerLock.Release();
                }
            });
        }
    }
}
