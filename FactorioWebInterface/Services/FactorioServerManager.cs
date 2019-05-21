using DSharpPlus;
using DSharpPlus.Entities;
using FactorioWebInterface.Data;
using FactorioWebInterface.Hubs;
using FactorioWebInterface.Models;
using FactorioWebInterface.Utils;
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

namespace FactorioWebInterface.Services
{
    public class FactorioServerManager : IFactorioServerManager
    {
        // Match on first [*] and capture everything after.
        private static readonly Regex tagRegex = new Regex(@"(\[[^\[\]]+\])\s*((?:.|\s)*)\s*", RegexOptions.Compiled);

        // Match all [*]. 
        private static readonly Regex serverTagRegex = new Regex(@"\[.*?\]", RegexOptions.Compiled);

        // Match number and capture everything after.
        private static readonly Regex outputRegex = new Regex(@"\d+\.\d+ (.+)", RegexOptions.Compiled);

        private static readonly JsonSerializerSettings banListSerializerSettings = new JsonSerializerSettings()
        {
            Formatting = Formatting.Indented,
            NullValueHandling = NullValueHandling.Ignore
        };

        private readonly IConfiguration _configuration;
        private readonly DiscordBotContext _discordBotContext;
        private readonly IHubContext<FactorioProcessHub, IFactorioProcessClientMethods> _factorioProcessHub;
        private readonly IHubContext<FactorioControlHub, IFactorioControlClientMethods> _factorioControlHub;
        private readonly DbContextFactory _dbContextFactory;
        private readonly ILogger<FactorioServerManager> _logger;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly FactorioAdminManager _factorioAdminManager;
        private readonly FactorioUpdater _factorioUpdater;
        private readonly FactorioModManager _factorioModManager;
        private readonly FactorioBanManager _factorioBanManager;
        private readonly FactorioFileManager _factorioFileManager;
        private readonly ScenarioDataManager _scenarioDataManger;

        //private SemaphoreSlim serverLock = new SemaphoreSlim(1, 1);
        private Dictionary<string, FactorioServerData> servers = FactorioServerData.Servers;

        private readonly string factorioWrapperName;

        public FactorioServerManager
        (
            IConfiguration configuration,
            DiscordBotContext discordBotContext,
            IHubContext<FactorioProcessHub, IFactorioProcessClientMethods> factorioProcessHub,
            IHubContext<FactorioControlHub, IFactorioControlClientMethods> factorioControlHub,
            DbContextFactory dbContextFactory,
            ILogger<FactorioServerManager> logger,
            IHttpClientFactory httpClientFactory,
            FactorioAdminManager factorioAdminManager,
            FactorioUpdater factorioUpdater,
            FactorioModManager factorioModManager,
            FactorioBanManager factorioBanManager,
            FactorioFileManager factorioFileManager,
            ScenarioDataManager scenarioDataManger
        )
        {
            _configuration = configuration;
            _discordBotContext = discordBotContext;
            _factorioProcessHub = factorioProcessHub;
            _factorioControlHub = factorioControlHub;
            _dbContextFactory = dbContextFactory;
            _logger = logger;
            _httpClientFactory = httpClientFactory;
            _factorioAdminManager = factorioAdminManager;
            _factorioUpdater = factorioUpdater;
            _factorioModManager = factorioModManager;
            _factorioBanManager = factorioBanManager;
            _factorioFileManager = factorioFileManager;
            _scenarioDataManger = scenarioDataManger;

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
            _scenarioDataManger.EntryChanged += _scenarioDataManger_EntryChanged;
            _factorioBanManager.BanChanged += _factorioBanManager_BanChanged;
            _factorioFileManager.TempSaveFilesChanged += _factorioFileManager_TempSaveFilesChanged;
            _factorioFileManager.LocalSaveFilesChanged += _factorioFileManager_LocalSaveFilesChanged;
            _factorioFileManager.GlobalSaveFilesChanged += _factorioFileManager_GlobalSaveFilesChanged;
            _factorioFileManager.LogFilesChanged += _factorioFileManager_LogFilesChanged;
            _factorioFileManager.ChatLogFilesChanged += _factorioFileManager_ChatLogFilesChanged;
            _factorioFileManager.ScenariosChanged += _factorioFileManager_ScenariosChanged;
            _factorioModManager.ModPackChanged += _factorioModManager_ModPackChanged;
        }

        private void _factorioFileManager_TempSaveFilesChanged(FactorioFileManager sender, FilesChangedEventArgs eventArgs)
        {
            var id = eventArgs.ServerId;
            _factorioControlHub.Clients.Group(id).SendTempSavesFiles(id, eventArgs.ChangedData);
        }

        private void _factorioFileManager_LocalSaveFilesChanged(FactorioFileManager sender, FilesChangedEventArgs eventArgs)
        {
            var id = eventArgs.ServerId;
            _factorioControlHub.Clients.Group(id).SendLocalSaveFiles(id, eventArgs.ChangedData);
        }

        private void _factorioFileManager_GlobalSaveFilesChanged(FactorioFileManager sender, FilesChangedEventArgs eventArgs)
        {
            _factorioControlHub.Clients.All.SendGlobalSaveFiles(eventArgs.ChangedData);
        }

        private void _factorioFileManager_LogFilesChanged(FactorioFileManager sender, FilesChangedEventArgs eventArgs)
        {
            var id = eventArgs.ServerId;
            _factorioControlHub.Clients.Group(id).SendLogFiles(id, eventArgs.ChangedData);
        }

        private void _factorioFileManager_ChatLogFilesChanged(FactorioFileManager sender, FilesChangedEventArgs eventArgs)
        {
            var id = eventArgs.ServerId;
            _factorioControlHub.Clients.Group(id).SendChatLogFiles(id, eventArgs.ChangedData);
        }

        private void _factorioFileManager_ScenariosChanged(FactorioFileManager sender, CollectionChangedData<ScenarioMetaData> eventArgs)
        {
            _factorioControlHub.Clients.All.SendScenarios(eventArgs);
        }

        private void _factorioModManager_ModPackChanged(FactorioModManager sender, CollectionChangedData<ModPackMetaData> eventArgs)
        {
            _factorioControlHub.Clients.All.SendModPacks(eventArgs);
        }

        private void _factorioBanManager_BanChanged(FactorioBanManager sender, FactorioBanEventArgs eventArgs)
        {
            var changeData = eventArgs.ChangeData;

            void BanAdded()
            {
                if (!eventArgs.SynchronizeWithServers)
                {
                    return;
                }

                foreach (var ban in changeData.NewItems)
                {
                    // /ban doesn't support names with spaces.
                    if (ban.Username.Contains(' '))
                    {
                        return;
                    }

                    var command = $"/ban {ban.Username} {ban.Reason}";

                    if (command.EndsWith('.'))
                    {
                        command.Substring(0, command.Length - 1);
                    }

                    SendBanCommandToEachRunningServerExcept(command, eventArgs.Source);
                }
            }

            void BanRemoved()
            {
                if (!eventArgs.SynchronizeWithServers)
                {
                    return;
                }

                foreach (var ban in changeData.OldItems)
                {
                    var username = ban.Username;

                    // /ban doesn't support names with spaces.
                    if (username.Contains(' '))
                    {
                        return;
                    }

                    var command = $"/unban {username}";

                    SendBanCommandToEachRunningServerExcept(command, eventArgs.Source);
                }
            }

            switch (changeData.Type)
            {
                case CollectionChangeType.Reset:
                    break;
                case CollectionChangeType.Remove:
                    BanRemoved();
                    break;
                case CollectionChangeType.Add:
                    BanAdded();
                    break;
                case CollectionChangeType.AddAndRemove:
                    BanRemoved();
                    BanAdded();
                    break;
                default:
                    break;
            }
        }

        private void _scenarioDataManger_EntryChanged(ScenarioDataManager sender, ScenarioDataEntryChangedEventArgs eventArgs)
        {
            _ = Task.Run(async () =>
             {
                 var sourceId = eventArgs.Source;
                 var data = eventArgs.ScenarioDataEntry;

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
             });
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
                    MessageType = Models.MessageType.Status,
                    Message = $"[STATUS] Change from {oldStatusString} to {newStatusString}"
                };
            }
            else
            {
                message = new MessageData()
                {
                    ServerId = serverData.ServerId,
                    MessageType = Models.MessageType.Status,
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
                MessageType = Models.MessageType.Discord,
                Message = $"[Discord] {eventArgs.User.Username}: {eventArgs.Message}"
            };

            _ = SendToFactorioControl(eventArgs.ServerId, messageData);
        }

        private Task RotateLogs(FactorioServerData serverData)
        {
            return Task.Run(() =>
            {
                _factorioFileManager.RotateFactorioLogs(serverData);
                _factorioFileManager.RotateChatLogs(serverData);
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

            var a = await _factorioAdminManager.GetAdmins();
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

        private string PrepareModDirectory(FactorioServerData serverData)
        {
            var dir = _factorioModManager.GetModPackDirectoryInfo(serverData.ModPack);
            if (dir == null)
            {
                serverData.ModPack = "";
                return "";
            }
            else
            {
                return dir.FullName;
            }
        }

        private async Task<string> PrepareServer(FactorioServerData serverData)
        {
            var banTask = BuildBanList(serverData);
            var adminTask = BuildAdminList(serverData);
            var logTask = RotateLogs(serverData);

            serverData.TrackingDataSets.Clear();

            serverData.OnlinePlayers.Clear();
            serverData.OnlinePlayerCount = 0;

            serverData.LastTempFilesChecked = DateTime.UtcNow;

            string modDirPath = PrepareModDirectory(serverData);

            await banTask;
            await adminTask;
            await logTask;

            return modDirPath;
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

                        var scenarioDir = new DirectoryInfo(serverData.LocalScenarioDirectoryPath);
                        if (scenarioDir.Exists)
                        {
                            scenarioDir.Delete(true);
                        }

                        string modDirPath = await PrepareServer(serverData);

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
                        if (modDirPath != "")
                        {
                            arguments += $" --mod-directory {modDirPath}";
                        }

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
                            MessageType = Models.MessageType.Control,
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

            var saveFile = _factorioFileManager.GetSaveFile(serverId, directoryName, fileName);
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

                                var fi = new FileInfo(copyToPath);
                                fi.LastWriteTimeUtc = DateTime.UtcNow;

                                var data = new FileMetaData()
                                {
                                    Name = fi.Name,
                                    CreatedTime = fi.CreationTimeUtc,
                                    LastModifiedTime = fi.LastWriteTimeUtc,
                                    Size = fi.Length,
                                    Directory = Constants.TempSavesDirectoryName
                                };
                                var changeData = CollectionChangedData.Add(new[] { data });
                                var ev = new FilesChangedEventArgs(serverId, changeData);

                                _factorioFileManager.RaiseTempFilesChanged(ev);
                                break;
                            case Constants.TempSavesDirectoryName:
                                break;
                            default:
                                return Result.Failure(Constants.UnexpctedErrorKey, $"File {saveFile.FullName}.");
                        }

                        var scenarioDir = new DirectoryInfo(serverData.LocalScenarioDirectoryPath);
                        if (scenarioDir.Exists)
                        {
                            scenarioDir.Delete(true);
                        }

                        string modDirPath = await PrepareServer(serverData);

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
                        if (modDirPath != "")
                        {
                            arguments += $" --mod-directory {modDirPath}";
                        }

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
                            MessageType = Models.MessageType.Control,
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

            string modDirPath = await PrepareServer(serverData);

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
            if (modDirPath != "")
            {
                arguments += $" --mod-directory {modDirPath}";
            }

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
                MessageType = Models.MessageType.Control,
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
                MessageType = Models.MessageType.Control,
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
                            MessageType = Models.MessageType.Control,
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
                MessageType = Models.MessageType.Control,
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
                            MessageType = Models.MessageType.Status,
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
                            MessageType = Models.MessageType.Status,
                            Message = $"[STATUS]: Changed from {oldStatus} to {FactorioServerStatus.Crashed}"
                        };

                        serverData.ControlMessageBuffer.Add(messageData);
                        _ = group.SendMessage(messageData);

                        var messageData2 = new MessageData()
                        {
                            ServerId = serverId,
                            MessageType = Models.MessageType.Control,
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
                    MessageType = Models.MessageType.Status,
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

        private async Task DoTags(string serverId, string data, DateTime dateTime)
        {
            var match = tagRegex.Match(data);
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

        private void DoCheckSave(string serverId, string data)
        {
            var match = outputRegex.Match(data);
            if (!match.Success)
            {
                return;
            }

            string line = match.Groups[1].Value;
            if (!line.EndsWith("Saving finished"))
            {
                return;
            }

            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknown serverId: {serverId}", serverId);
                return;
            }

            _factorioFileManager.RaiseRecentTempFiles(serverData);
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
                MessageType = Models.MessageType.Output,
                Message = data
            };

            _ = SendToFactorioControl(serverId, messageData);

            var t1 = DoTags(serverId, data, dateTime);
            DoCheckSave(serverId, data);

            await t1;
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
                var value = await _scenarioDataManger.GetValue(data.DataSet, data.Key);

                var cb = FactorioCommandBuilder
                    .ServerCommand("raise_callback")
                    .Add(func)
                    .Add(",")
                    .Add("{data_set=").AddDoubleQuotedString(data.DataSet)
                    .Add(",key=").AddDoubleQuotedString(data.Key);

                if (value != null)
                {
                    cb.Add(",value=").Add(value);
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
                var entries = await _scenarioDataManger.GetAllEntries(data.DataSet);

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

        private async Task DoSetData(string serverId, string content)
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

            await _scenarioDataManger.UpdateEntry(data, serverId);
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

        public async Task FactorioControlDataReceived(string serverId, string data, string actor)
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
                    Admin = actor,
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

                await _factorioBanManager.AddBanFromGame(ban, serverId);
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

                await _factorioBanManager.RemoveBanFromGame(player, serverId, actor);
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
                    Message = $"[Server] {actor}: {data}",
                    MessageType = Models.MessageType.Output
                };

                try
                {
                    await sourceServerData.ServerLock.WaitAsync();
                    if (sourceServerData.Status == FactorioServerStatus.Running)
                    {
                        string message = SanitizeDiscordChat(data);
                        string command = $"/silent-command game.print('[Server] {actor}: {message}')";
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

            await _factorioBanManager.AddBanFromGame(ban, serverId);
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

            await _factorioBanManager.RemoveBanFromGame(player, serverId, admin);
        }

        public void FactorioWrapperDataReceived(string serverId, string data, DateTime dateTime)
        {
            var messageData = new MessageData()
            {
                ServerId = serverId,
                MessageType = Models.MessageType.Wrapper,
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
                string cleanServerName = serverTagRegex.Replace(serverData.ServerSettings.Name, "");
                string cleanVersion = serverData.Version.Replace('.', '_');

                name = $"s{serverId}-{cleanServerName}-{cleanVersion}";
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

                await _factorioFileManager.RaiseRecentTempFiles(serverData);

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
                    MessageType = Models.MessageType.Status,
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

        public Task OnProcessRegistered(string serverId)
        {
            return _factorioProcessHub.Clients.Group(serverId).GetStatus();
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

            var a = await _factorioAdminManager.GetAdmins();
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
                    var a = await _factorioAdminManager.GetAdmins();
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

        public Result DeflateSave(string connectionId, string serverId, string directoryName, string fileName, string newFileName = "")
        {
            var directory = _factorioFileManager.GetSaveDirectory(serverId, directoryName);

            if (directory == null)
            {
                return Result.Failure(new Error(Constants.InvalidDirectoryErrorKey, Path.Combine(serverId, directoryName)));
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

                        newFileInfo.Refresh();

                        string dirName = directory.Name;

                        var data = new FileMetaData()
                        {
                            Name = newFileInfo.Name,
                            CreatedTime = newFileInfo.CreationTimeUtc,
                            LastModifiedTime = newFileInfo.LastWriteTimeUtc,
                            Directory = dirName,
                            Size = newFileInfo.Length
                        };
                        var changeData = CollectionChangedData.Add(new[] { data });
                        var ev = new FilesChangedEventArgs(serverId, changeData);

                        switch (dirName)
                        {
                            case Constants.TempSavesDirectoryName:
                                _factorioFileManager.RaiseTempFilesChanged(ev);
                                break;
                            case Constants.LocalSavesDirectoryName:
                                _factorioFileManager.RaiseLocalFilesChanged(ev);
                                break;
                            case Constants.GlobalSavesDirectoryName:
                                _factorioFileManager.RaiseGlobalFilesChanged(ev);
                                break;
                            default:
                                break;
                        }
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

        public async Task<string> GetSelectedModPack(string serverId)
        {
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknown serverId: {serverId}", serverId);
                return null;
            }

            try
            {
                await serverData.ServerLock.WaitAsync();

                return serverData.ModPack;
            }
            finally
            {
                serverData.ServerLock.Release();
            }
        }

        public Task SetSelectedModPack(string serverId, string modPack)
        {
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknown serverId: {serverId}", serverId);
                return Task.CompletedTask;
            }

            return Task.Run(async () =>
            {
                try
                {
                    await serverData.ServerLock.WaitAsync();

                    serverData.ModPack = modPack;

                    _ = _factorioControlHub.Clients.Group(serverId).SendSelectedModPack(modPack);
                }
                finally
                {
                    serverData.ServerLock.Release();
                }
            });
        }

        public FileMetaData[] GetTempSaveFiles(string serverId)
        {
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknown serverId: {serverId}", serverId);
                return Array.Empty<FileMetaData>();
            }

            return _factorioFileManager.GetTempSaveFiles(serverData);
        }

        public FileMetaData[] GetLocalSaveFiles(string serverId)
        {
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknown serverId: {serverId}", serverId);
                return Array.Empty<FileMetaData>();
            }

            return _factorioFileManager.GetLocalSaveFiles(serverData);
        }

        public FileMetaData[] GetGlobalSaveFiles()
        {
            return _factorioFileManager.GetGlobalSaveFiles();
        }

        public ScenarioMetaData[] GetScenarios()
        {
            return _factorioFileManager.GetScenarios();
        }

        public List<FileMetaData> GetLogs(string serverId)
        {
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknown serverId: {serverId}", serverId);
                return new List<FileMetaData>(0);
            }

            return _factorioFileManager.GetLogs(serverData);
        }

        public List<FileMetaData> GetChatLogs(string serverId)
        {
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknown serverId: {serverId}", serverId);
                return new List<FileMetaData>(0);
            }

            return _factorioFileManager.GetChatLogs(serverData);
        }
    }
}
