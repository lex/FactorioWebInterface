using Discord;
using FactorioWebInterface.Data;
using FactorioWebInterface.Hubs;
using FactorioWebInterface.Models;
using FactorioWebInterface.Models.CodeDeflate;
using FactorioWebInterface.Services.Discord;
using FactorioWebInterface.Utils;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Serilog.Core;
using Shared;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
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

        private static readonly TimeSpan crashStartTimeCooldown = TimeSpan.FromSeconds(10);

        private readonly IConfiguration _configuration;
        private readonly IDiscordService _discordService;
        private readonly IHubContext<FactorioProcessHub, IFactorioProcessClientMethods> _factorioProcessHub;
        private readonly IHubContext<FactorioControlHub, IFactorioControlClientMethods> _factorioControlHub;
        private readonly IDbContextFactory _dbContextFactory;
        private readonly ILogger<FactorioServerManager> _logger;
        private readonly IFactorioAdminService _factorioAdminService;
        private readonly FactorioUpdater _factorioUpdater;
        private readonly IFactorioModManager _factorioModManager;
        private readonly IFactorioBanService _factorioBanManager;
        private readonly IFactorioFileManager _factorioFileManager;
        private readonly ScenarioDataManager _scenarioDataManger;
        private readonly IFactorioServerDataService _factorioServerDataService;
        private readonly IFactorioServerPreparer _factorioServerPreparer;
        private readonly IFactorioServerRunner _factorioServerRunner;

        private readonly string factorioWrapperName;

        public FactorioServerManager
        (
            IConfiguration configuration,
            IDiscordService discordService,
            IHubContext<FactorioProcessHub, IFactorioProcessClientMethods> factorioProcessHub,
            IHubContext<FactorioControlHub, IFactorioControlClientMethods> factorioControlHub,
            IDbContextFactory dbContextFactory,
            ILogger<FactorioServerManager> logger,
            IFactorioAdminService factorioAdminService,
            FactorioUpdater factorioUpdater,
            IFactorioModManager factorioModManager,
            IFactorioBanService factorioBanManager,
            IFactorioFileManager factorioFileManager,
            ScenarioDataManager scenarioDataManger,
            IFactorioServerDataService factorioServerDataService,
            IFactorioServerPreparer factorioServerPreparer,
            IFactorioServerRunner factorioServerRunner
        )
        {
            _configuration = configuration;
            _discordService = discordService;
            _factorioProcessHub = factorioProcessHub;
            _factorioControlHub = factorioControlHub;
            _dbContextFactory = dbContextFactory;
            _logger = logger;
            _factorioAdminService = factorioAdminService;
            _factorioUpdater = factorioUpdater;
            _factorioModManager = factorioModManager;
            _factorioBanManager = factorioBanManager;
            _factorioFileManager = factorioFileManager;
            _scenarioDataManger = scenarioDataManger;
            _factorioServerDataService = factorioServerDataService;
            _factorioServerPreparer = factorioServerPreparer;
            _factorioServerRunner = factorioServerRunner;

            string name = _configuration[Constants.FactorioWrapperNameKey];
            if (string.IsNullOrWhiteSpace(name))
            {
                factorioWrapperName = "factorioWrapper";
            }
            else
            {
                factorioWrapperName = name;
            }

            _discordService.FactorioDiscordDataReceived += FactorioDiscordDataReceived;
            _scenarioDataManger.EntryChanged += ScenarioDataManger_EntryChanged;
            _factorioBanManager.BanChanged += FactorioBanManager_BanChanged;
            _factorioFileManager.TempSaveFilesChanged += FactorioFileManager_TempSaveFilesChanged;
            _factorioFileManager.LocalSaveFilesChanged += FactorioFileManager_LocalSaveFilesChanged;
            _factorioFileManager.GlobalSaveFilesChanged += FactorioFileManager_GlobalSaveFilesChanged;
            _factorioFileManager.LogFilesChanged += FactorioFileManager_LogFilesChanged;
            _factorioFileManager.ChatLogFilesChanged += FactorioFileManager_ChatLogFilesChanged;
            _factorioFileManager.ScenariosChanged += FactorioFileManager_ScenariosChanged;
            _factorioModManager.ModPackChanged += FactorioModManager_ModPackChanged;
            _factorioUpdater.CachedVersionsChanged += FactorioUpdater_CachedVersionsChanged;
        }

        private void FactorioFileManager_TempSaveFilesChanged(IFactorioFileManager sender, FilesChangedEventArgs eventArgs)
        {
            var id = eventArgs.ServerId;
            _factorioControlHub.Clients.Group(id).SendTempSavesFiles(id, eventArgs.ChangedData);
        }

        private void FactorioFileManager_LocalSaveFilesChanged(IFactorioFileManager sender, FilesChangedEventArgs eventArgs)
        {
            var id = eventArgs.ServerId;
            _factorioControlHub.Clients.Group(id).SendLocalSaveFiles(id, eventArgs.ChangedData);
        }

        private void FactorioFileManager_GlobalSaveFilesChanged(IFactorioFileManager sender, FilesChangedEventArgs eventArgs)
        {
            _factorioControlHub.Clients.All.SendGlobalSaveFiles(eventArgs.ChangedData);
        }

        private void FactorioFileManager_LogFilesChanged(IFactorioFileManager sender, FilesChangedEventArgs eventArgs)
        {
            var id = eventArgs.ServerId;
            _factorioControlHub.Clients.Group(id).SendLogFiles(id, eventArgs.ChangedData);
        }

        private void FactorioFileManager_ChatLogFilesChanged(IFactorioFileManager sender, FilesChangedEventArgs eventArgs)
        {
            var id = eventArgs.ServerId;
            _factorioControlHub.Clients.Group(id).SendChatLogFiles(id, eventArgs.ChangedData);
        }

        private void FactorioFileManager_ScenariosChanged(IFactorioFileManager sender, CollectionChangedData<ScenarioMetaData> eventArgs)
        {
            _factorioControlHub.Clients.All.SendScenarios(eventArgs);
        }

        private void FactorioModManager_ModPackChanged(IFactorioModManager sender, CollectionChangedData<ModPackMetaData> eventArgs)
        {
            _factorioControlHub.Clients.All.SendModPacks(eventArgs);

            foreach (var server in _factorioServerDataService.Servers.Values)
            {
                _ = server.LockAsync(md =>
                {
                    string modPackName = md.ModPack;
                    if (eventArgs.OldItems.Any(modPackMetaData => modPackMetaData.Name == modPackName))
                    {
                        md.ModPack = "";
                        _ = _factorioControlHub.Clients.Group(md.ServerId).SendSelectedModPack("");
                    }
                });
            }
        }

        private void FactorioBanManager_BanChanged(IFactorioBanService sender, FactorioBanEventArgs eventArgs)
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
                    var username = ban.Username;

                    // /ban doesn't support names with spaces.
                    if (username == null || username.Contains(' '))
                    {
                        return;
                    }

                    var command = $"/ban {ban.Username} {ban.Reason}";

                    if (command.EndsWith('.'))
                    {
                        command = command[0..^1];
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
                    if (username == null || username.Contains(' '))
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

        private void ScenarioDataManger_EntryChanged(ScenarioDataManager sender, ScenarioDataEntryChangedEventArgs eventArgs)
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
                 foreach (var entry in _factorioServerDataService.Servers)
                 {
                     var id = entry.Key;
                     var server = entry.Value;
                     if (id != sourceId && server.Status == FactorioServerStatus.Running)
                     {
                         await server.LockAsync(md =>
                         {
                             if (md.TrackingDataSets.Contains(dataSet))
                             {
                                 _ = clients.Group(id).SendToFactorio(command);
                             }
                         });
                     }
                 }
             });
        }

        private void FactorioUpdater_CachedVersionsChanged(FactorioUpdater sender, CollectionChangedData<string> eventArgs)
        {
            _factorioControlHub.Clients.All.SendCachedVersions(eventArgs);
        }

        private Task SendControlMessageNonLocking(FactorioServerMutableData mutableData, MessageData message)
        {
            mutableData.ControlMessageBuffer.Add(message);
            return _factorioControlHub.Clients.Groups(mutableData.ServerId).SendMessage(message);
        }

        private Task ChangeStatusNonLocking(FactorioServerMutableData mutableData, FactorioServerStatus newStatus, string byUser = "")
        {
            var oldStatus = mutableData.Status;
            mutableData.Status = newStatus;

            string oldStatusString = oldStatus.ToString();
            string newStatusString = newStatus.ToString();

            MessageData message;
            if (string.IsNullOrWhiteSpace(byUser))
            {
                message = new MessageData()
                {
                    ServerId = mutableData.ServerId,
                    MessageType = Models.MessageType.Status,
                    Message = $"[STATUS] Change from {oldStatusString} to {newStatusString}"
                };
            }
            else
            {
                message = new MessageData()
                {
                    ServerId = mutableData.ServerId,
                    MessageType = Models.MessageType.Status,
                    Message = $"[STATUS] Change from {oldStatusString} to {newStatusString} by user {byUser}"
                };
            }

            mutableData.ControlMessageBuffer.Add(message);
            var group = _factorioControlHub.Clients.Groups(mutableData.ServerId);

            return Task.WhenAll(group.FactorioStatusChanged(newStatusString, oldStatusString), group.SendMessage(message));
        }

        private static string SanitizeGameChat(string message)
        {
            return Format.Sanitize(message).Replace("@", "@\u200B"); // Prevent mentions from working.
        }

        private static string SanitizeDiscordChat(string message)
        {
            StringBuilder sb = new StringBuilder(message);

            sb.Replace("\\", "\\\\");
            sb.Replace("'", "\\'");
            sb.Replace("\n", " ");

            return sb.ToString();
        }

        private void FactorioDiscordDataReceived(IDiscordService sender, ServerMessageEventArgs eventArgs)
        {
            var serverId = eventArgs.ServerId;
            if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
            {
                return;
            }

            string name = SanitizeDiscordChat(eventArgs.User.Username);
            string message = SanitizeDiscordChat(eventArgs.Message);
            string data = $"/silent-command game.print('[Discord] {name}: {message}')";

            LogChat(serverData, $"[Discord] {name}: {message}", DateTime.UtcNow);

            _ = serverData.LockAsync(md =>
            {
                FactorioServerUtils.SendDiscordMessage(md, _factorioControlHub, $"[Discord] {eventArgs.User.Username}: {eventArgs.Message}");

                if (md.ServerExtraSettings.DiscordToGameChat)
                {
                    SendToFactorioProcess(eventArgs.ServerId, data);
                }
            });
        }

        private void SendBanCommandToEachRunningServerExcept(string data, string exceptId)
        {
            var clients = _factorioProcessHub.Clients;
            foreach (var server in _factorioServerDataService.Servers)
            {
                var serverData = server.Value;
                if (server.Key == exceptId || serverData.Status != FactorioServerStatus.Running)
                {
                    continue;
                }

                _ = serverData.LockAsync(md =>
                {
                    if (md.ServerExtraSettings.SyncBans)
                    {
                        clients.Group(md.ServerId).SendToFactorio(data);
                    }
                });
            }
        }

        public bool IsValidServerId(string serverId)
        {
            return _factorioServerDataService.IsValidServerId(serverId);
        }

        public async Task<Result> Resume(string serverId, string userName)
        {
            if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
            {
                return Result.Failure(Constants.ServerIdErrorKey, $"serverId {serverId} not found.");
            }

            var result = _factorioServerPreparer.CanResume(serverData.TempSavesDirectoryPath);
            if (!result.Success)
            {
                return result;
            }

            async Task<Result> ResumeInner(FactorioServerMutableData mutableData)
            {
                if (!mutableData.Status.IsStartable())
                {
                    return Result.Failure(Constants.InvalidServerStateErrorKey, $"Cannot resume server when in state {mutableData.Status}");
                }

                _ = FactorioServerUtils.SendControlMessage(mutableData, _factorioControlHub, $"Server resumed by user: {userName}");

                var startInfoResult = await _factorioServerPreparer.PrepareResume(mutableData);
                if (!startInfoResult.Success)
                {
                    return startInfoResult;
                }

                var startInfo = startInfoResult.Value!;
                var runResult = _factorioServerRunner.Run(mutableData, startInfo);
                if (!runResult.Success)
                {
                    return runResult;
                }

                return Result.OK;
            }

            try
            {
                return await serverData.LockAsync(ResumeInner);
            }
            catch (Exception e)
            {
                _logger.LogError(nameof(Resume), e);
                return Result.Failure(Constants.UnexpectedErrorKey);
            }
        }

        public async Task<Result> Load(string serverId, string directoryName, string fileName, string userName)
        {
            if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
            {
                return Result.Failure(Constants.ServerIdErrorKey, $"serverId {serverId} not found.");
            }

            var result = _factorioServerPreparer.CanLoadSave(serverId, directoryName, fileName);
            if (!result.Success)
            {
                return result;
            }

            async Task<Result> LoadInner(FactorioServerMutableData mutableData)
            {
                if (!mutableData.Status.IsStartable())
                {
                    return Result.Failure(Constants.InvalidServerStateErrorKey, $"Cannot load server when in state {mutableData.Status}");
                }

                _ = FactorioServerUtils.SendControlMessage(mutableData, _factorioControlHub, $"Server load file: {fileName} by user: {userName}");

                var startInfoResult = await _factorioServerPreparer.PrepareLoadSave(mutableData, directoryName, fileName);
                if (!startInfoResult.Success)
                {
                    return startInfoResult;
                }

                var startInfo = startInfoResult.Value!;
                var runResult = _factorioServerRunner.Run(mutableData, startInfo);
                if (!runResult.Success)
                {
                    return runResult;
                }

                return Result.OK;
            }

            try
            {
                return await serverData.LockAsync(LoadInner);
            }
            catch (Exception e)
            {
                _logger.LogError(nameof(Load), e);
                return Result.Failure(Constants.UnexpectedErrorKey);
            }
        }

        private async Task<Result> StartScenarioInner(FactorioServerMutableData mutableData, string scenarioName, string userName)
        {
            if (!mutableData.Status.IsStartable())
            {
                return Result.Failure(Constants.InvalidServerStateErrorKey, $"Cannot load scenario when server in state {mutableData.Status}");
            }

            _ = FactorioServerUtils.SendControlMessage(mutableData, _factorioControlHub, $"Server start scenario: {scenarioName} by user: {userName}");

            var startInfoResult = await _factorioServerPreparer.PrepareStartScenario(mutableData, scenarioName);
            if (!startInfoResult.Success)
            {
                return startInfoResult;
            }

            var startInfo = startInfoResult.Value!;
            var runResult = _factorioServerRunner.Run(mutableData, startInfo);
            if (!runResult.Success)
            {
                return runResult;
            }

            return Result.OK;
        }

        public async Task<Result> StartScenario(string serverId, string scenarioName, string userName)
        {
            if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
            {
                return Result.Failure(Constants.ServerIdErrorKey, $"serverId {serverId} not found.");
            }

            var result = _factorioServerPreparer.CanStartScenario(scenarioName);
            if (!result.Success)
            {
                return result;
            }

            try
            {
                return await serverData.LockAsync(md => StartScenarioInner(md, scenarioName, userName));
            }
            catch (Exception e)
            {
                _logger.LogError(nameof(StartScenario), e);
                return Result.Failure(Constants.UnexpectedErrorKey);
            }
        }

        public async Task<Result> ForceStartScenario(string serverId, string scenarioName, string userName)
        {
            if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
            {
                return Result.Failure(Constants.ServerIdErrorKey, $"serverId {serverId} not found.");
            }

            var result = _factorioServerPreparer.CanStartScenario(scenarioName);
            if (!result.Success)
            {
                return result;
            }

            async Task<Result> ForceStartScenarioInner(FactorioServerMutableData mutableData)
            {
                if (mutableData.Status == FactorioServerStatus.Running)
                {
                    mutableData.StopCallback = md => StartScenarioInner(md, scenarioName, userName);

                    await StopInner(mutableData, userName);

                    return Result.OK;
                }
                else if (mutableData.Status.IsStartable())
                {
                    return await StartScenarioInner(mutableData, scenarioName, userName);
                }
                else
                {
                    return Result.Failure(Constants.InvalidServerStateErrorKey, $"Cannot force start scenario when server in state {mutableData.Status}");
                }
            }

            try
            {
                return await serverData.LockAsync(ForceStartScenarioInner);
            }
            catch (Exception e)
            {
                _logger.LogError(nameof(ForceStartScenario), e);
                return Result.Failure(Constants.UnexpectedErrorKey);
            }
        }

        private async Task StopInner(FactorioServerMutableData mutableData, string userName)
        {
            string serverId = mutableData.ServerId;

            _ = FactorioServerUtils.SendControlMessage(mutableData, _factorioControlHub, $"Server stopped by user {userName}");

#if WINDOWS
            await _factorioProcessHub.Clients.Groups(serverId).ForceStop();
#else
            await _factorioProcessHub.Clients.Groups(serverId).Stop();
#endif

            _logger.LogInformation("server stopped :serverId {serverId} user: {userName}", serverId, userName);
        }
#pragma warning disable CS1998
        public async Task<Result> Stop(string serverId, string userName)
        {
#pragma warning restore CS1998
#if WINDOWS
            return Result.Failure(Constants.NotSupportedErrorKey, "Stop is not supported on Windows.");
#else
            if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
            {
                return Result.Failure(Constants.ServerIdErrorKey, $"serverId {serverId} not found.");
            }

            if (!serverData.Status.IsStoppable())
            {
                return Result.Failure(Constants.InvalidServerStateErrorKey, $"Cannot stop server when in state {serverData.Status}");
            }

            await serverData.LockAsync(md =>
            {
                md.StopCallback = null;
                return StopInner(md, userName);
            });

            return Result.OK;
#endif
        }

        public async Task<Result> ForceStop(string serverId, string userName)
        {
            if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
            {
                return Result.Failure(Constants.ServerIdErrorKey, $"serverId {serverId} not found.");
            }

            async Task ForceStopInner(FactorioServerMutableData mutableData)
            {
                mutableData.StopCallback = null;

                var message = new MessageData()
                {
                    ServerId = serverId,
                    MessageType = Models.MessageType.Control,
                    Message = $"Server killed by user {userName}"
                };

                _ = SendControlMessageNonLocking(mutableData, message);

                if (mutableData.Status.IsStoppable())
                {
                    try
                    {
                        _logger.LogInformation("Killing server via wrapper serverId: {serverId} user: {userName}", serverId, userName);
                        await _factorioProcessHub.Clients.Groups(serverId).ForceStop().TimeoutAfter(TimeSpan.FromSeconds(3));

                        return;
                    }
                    catch (OperationCanceledException)
                    {
                        _logger.LogInformation("No response Killing server via wrapper serverId: {serverId} user: {userName}", serverId, userName);
                    }
                }

                _logger.LogInformation("Killing server via process lookup serverId: {serverId} user: {userName}", serverId, userName);

                _ = ChangeStatusNonLocking(mutableData, FactorioServerStatus.Killing);

                int foundCount = 0;
                int killedCount = 0;
                var processes = Process.GetProcessesByName("factorio");
                foreach (var process in processes)
                {
                    try
                    {
                        if (process.MainModule.FileName.EndsWith(mutableData.ExecutablePath))
                        {
                            foundCount++;
                            process.Kill(entireProcessTree: true);
                            killedCount++;
                        }
                    }
                    catch (Exception e)
                    {
                        _logger.LogWarning(e, "ForceStop Kill Processes");
                    }
                }

                var killedMessage = new MessageData()
                {
                    ServerId = serverId,
                    MessageType = Models.MessageType.Control,
                    Message = $"{killedCount} out of {foundCount} processes killed"
                };
                _ = SendControlMessageNonLocking(mutableData, killedMessage);

                _ = ChangeStatusNonLocking(mutableData, FactorioServerStatus.Killed);
            }

            await serverData.LockAsync(ForceStopInner);

            return Result.OK;
        }

        public async Task<Result> Save(string serverId, string userName, string saveName)
        {
            if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
            {
                return Result.Failure(Constants.ServerIdErrorKey, $"serverId {serverId} not found.");
            }

            if (serverData.Status != FactorioServerStatus.Running)
            {
                return Result.Failure(Constants.InvalidServerStateErrorKey, $"Cannot save game when in state {serverData.Status}");
            }

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

        /// <summary>
        /// SignalR processes one message at a time, so this method needs to return before the downloading starts.
        /// Else if the user clicks the update button twice in quick succession, the first request is finished before
        /// the second requests starts, meaning the update will happen twice.
        /// </summary>
        private void InstallInner(string serverId, FactorioServerData serverData, string version)
        {
            _ = Task.Run(async () =>
            {
                var result = await _factorioUpdater.DoUpdate(serverData, version);

                string executableVersion = FactorioVersionFinder.GetVersionString(serverData.ExecutablePath);

                var oldStatus = serverData.Status;
                var group = _factorioControlHub.Clients.Group(serverId);

                void ReportInstall(FactorioServerMutableData mutableData)
                {
                    mutableData.Version = executableVersion;
                    _ = group.SendVersion(executableVersion);

                    if (result.Success)
                    {
                        mutableData.Status = FactorioServerStatus.Updated;

                        _ = group.FactorioStatusChanged(nameof(FactorioServerStatus.Updated), oldStatus.ToString());

                        var messageData = new MessageData()
                        {
                            ServerId = serverId,
                            MessageType = Models.MessageType.Status,
                            Message = $"[STATUS]: Changed from {oldStatus} to {nameof(FactorioServerStatus.Updated)}"
                        };

                        mutableData.ControlMessageBuffer.Add(messageData);
                        _ = group.SendMessage(messageData);

                        string versionText = version == "latest" && executableVersion != FactorioVersionFinder.errorMesssage
                            ? $"{executableVersion} (latest)"
                            : version;

                        var embed = new EmbedBuilder()
                        {
                            Title = "Status:",
                            Description = $"Server has **updated** to version {versionText}",
                            Color = DiscordColors.updateColor,
                            Timestamp = DateTimeOffset.UtcNow
                        };
                        _ = _discordService.SendToConnectedChannel(serverId, embed: embed.Build());

                        _logger.LogInformation("Updated server to version: {version}.", executableVersion);
                    }
                    else
                    {
                        mutableData.Status = FactorioServerStatus.Crashed;

                        _ = group.FactorioStatusChanged(nameof(FactorioServerStatus.Crashed), oldStatus.ToString());

                        var messageData = new MessageData()
                        {
                            ServerId = serverId,
                            MessageType = Models.MessageType.Status,
                            Message = $"[STATUS]: Changed from {oldStatus} to {nameof(FactorioServerStatus.Crashed)}"
                        };

                        mutableData.ControlMessageBuffer.Add(messageData);
                        _ = group.SendMessage(messageData);

                        var messageData2 = new MessageData()
                        {
                            ServerId = serverId,
                            MessageType = Models.MessageType.Output,
                            Message = result.ToString()
                        };

                        mutableData.ControlMessageBuffer.Add(messageData2);
                        _ = group.SendMessage(messageData2);
                    }
                }

                await serverData.LockAsync(ReportInstall);
            });
        }

#pragma warning disable CS1998
        public async Task<Result> Install(string serverId, string userName, string version)
        {
#pragma warning restore CS1998
#if WINDOWS
            return Result.Failure(Constants.NotSupportedErrorKey, "Install is not supported on windows.");
#else
            if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
            {
                return Result.Failure($"Unknow serverId: {serverId}");
            }

            Result CheckCanUpdate(FactorioServerMutableData mutableData)
            {
                var oldStatus = mutableData.Status;

                if (!oldStatus.IsUpdatable())
                {
                    return Result.Failure(Constants.InvalidServerStateErrorKey, $"Cannot Update server when in state {oldStatus}");
                }

                mutableData.Status = FactorioServerStatus.Updating;

                var group = _factorioControlHub.Clients.Group(serverId);

                var controlMessage = new MessageData()
                {
                    ServerId = serverId,
                    MessageType = Models.MessageType.Control,
                    Message = $"Server updating to version: {version} by user: {userName}"
                };
                mutableData.ControlMessageBuffer.Add(controlMessage);
                _ = group.SendMessage(controlMessage);

                _ = group.FactorioStatusChanged(nameof(FactorioServerStatus.Updating), oldStatus.ToString());

                var statusMessage = new MessageData()
                {
                    ServerId = serverId,
                    MessageType = Models.MessageType.Status,
                    Message = $"[STATUS]: Changed from {oldStatus} to {nameof(FactorioServerStatus.Updating)} by user {userName}"
                };
                mutableData.ControlMessageBuffer.Add(statusMessage);
                _ = group.SendMessage(statusMessage);

                return Result.OK;
            }

            var result = await serverData.LockAsync(CheckCanUpdate);

            if (result.Success)
            {
                InstallInner(serverId, serverData, version);
            }

            return result;
#endif
        }

        public Task<FactorioServerStatus> GetStatus(string serverId)
        {
            if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
            {
                return Task.FromResult(FactorioServerStatus.Unknown);
            }

            return serverData.LockAsync(md => md.Status);
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
            if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
            {
                return;
            }

            await serverData.LockAsync(md => FactorioServerUtils.SendMessage(md, _factorioControlHub, data));
        }

        public Task<MessageData[]> GetFactorioControlMessagesAsync(string serverId)
        {
            if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
            {
                return Task.FromResult(Array.Empty<MessageData>());
            }

            return serverData.LockAsync(md => md.ControlMessageBuffer.ToArray());
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
                        if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
                        {
                            break;
                        }

                        if (await serverData.LockAsync(md => md.ServerExtraSettings.GameChatToDiscord))
                        {
                            _ = _discordService.SendToConnectedChannel(serverId, SanitizeGameChat(content));
                        }

                        LogChat(serverData, content, dateTime);
                        break;
                    }
                case Constants.ShoutTag:
                    {
                        if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
                        {
                            break;
                        }

                        if (await serverData.LockAsync(md => md.ServerExtraSettings.GameShoutToDiscord))
                        {
                            _ = _discordService.SendToConnectedChannel(serverId, SanitizeGameChat(content));
                        }

                        LogChat(serverData, content, dateTime);
                        break;
                    }
                case Constants.DiscordTag:
                    content = content.Replace("\\n", "\n");
                    content = SanitizeGameChat(content);
                    _ = _discordService.SendToConnectedChannel(serverId, content);
                    break;
                case Constants.DiscordRawTag:
                    content = content.Replace("\\n", "\n");
                    _ = _discordService.SendToConnectedChannel(serverId, content);
                    break;
                case Constants.DiscordBold:
                    content = content.Replace("\\n", "\n");
                    content = SanitizeGameChat(content);
                    content = Format.Bold(content);
                    _ = _discordService.SendToConnectedChannel(serverId, content);
                    break;
                case Constants.DiscordAdminTag:
                    content = content.Replace("\\n", "\n");
                    content = SanitizeGameChat(content);
                    _ = _discordService.SendToAdminChannel(content);
                    break;
                case Constants.DiscordAdminRawTag:
                    content = content.Replace("\\n", "\n");
                    _ = _discordService.SendToAdminChannel(content);
                    break;
                case Constants.DiscordNamedTag:
                    {
                        if (SplitNamedChannelDiscordMessage(content) is (string channelName, string message))
                        {
                            message = message.Replace("\\n", "\n");
                            message = SanitizeGameChat(message);
                            _ = _discordService.SendToNamedChannel(channelName, message);
                        }
                        break;
                    }
                case Constants.DiscordNamedRawTag:
                    {
                        if (SplitNamedChannelDiscordMessage(content) is (string channelName, string message))
                        {
                            message = message.Replace("\\n", "\n");
                            _ = _discordService.SendToNamedChannel(channelName, message);
                        }
                        break;
                    }
                case Constants.DiscordNamedBoldTag:
                    {
                        if (SplitNamedChannelDiscordMessage(content) is (string channelName, string message))
                        {
                            message = message.Replace("\\n", "\n");
                            message = SanitizeGameChat(message);
                            message = Format.Bold(message);
                            _ = _discordService.SendToNamedChannel(channelName, message);
                        }
                        break;
                    }
                case Constants.DiscordNamedEmbedTag:
                    {
                        if (SplitNamedChannelDiscordMessage(content) is (string channelName, string message))
                        {
                            message = message.Replace("\\n", "\n");
                            message = SanitizeGameChat(message);

                            var embed = new EmbedBuilder()
                            {
                                Description = message,
                                Color = DiscordColors.infoColor,
                                Timestamp = DateTimeOffset.UtcNow
                            };

                            _ = _discordService.SendToNamedChannel(channelName, embed: embed.Build());
                        }
                        break;
                    }
                case Constants.DiscordNamedEmbedRawTag:
                    {
                        if (SplitNamedChannelDiscordMessage(content) is (string channelName, string message))
                        {
                            message = message.Replace("\\n", "\n");

                            var embed = new EmbedBuilder()
                            {
                                Description = message,
                                Color = DiscordColors.infoColor,
                                Timestamp = DateTimeOffset.UtcNow
                            };

                            _ = _discordService.SendToNamedChannel(channelName, embed: embed.Build());
                        }
                        break;
                    }
                case Constants.PlayerJoinTag:
                    _ = DoPlayerJoined(serverId, content, dateTime);
                    break;
                case Constants.PlayerLeaveTag:
                    _ = DoPlayerLeft(serverId, content, dateTime);
                    break;
                case Constants.QueryPlayersTag:
                    _ = DoPlayerQuery(serverId, content);
                    break;
                case Constants.DiscordEmbedTag:
                    {
                        content = content.Replace("\\n", "\n");
                        content = SanitizeGameChat(content);

                        var embed = new EmbedBuilder()
                        {
                            Description = content,
                            Color = DiscordColors.infoColor,
                            Timestamp = DateTimeOffset.UtcNow
                        };

                        _ = _discordService.SendToConnectedChannel(serverId, embed: embed.Build());
                        break;
                    }
                case Constants.DiscordEmbedRawTag:
                    {
                        content = content.Replace("\\n", "\n");

                        var embed = new EmbedBuilder()
                        {
                            Description = content,
                            Color = DiscordColors.infoColor,
                            Timestamp = DateTimeOffset.UtcNow
                        };

                        _ = _discordService.SendToConnectedChannel(serverId, embed: embed.Build());
                        break;
                    }

                case Constants.DiscordAdminEmbedTag:
                    {
                        content = content.Replace("\\n", "\n");
                        content = SanitizeGameChat(content);

                        var embed = new EmbedBuilder()
                        {
                            Description = content,
                            Color = DiscordColors.infoColor,
                            Timestamp = DateTimeOffset.UtcNow
                        };

                        _ = _discordService.SendToAdminChannel(embed: embed.Build());
                        break;
                    }
                case Constants.DiscordAdminEmbedRawTag:
                    {
                        content = content.Replace("\\n", "\n");

                        var embed = new EmbedBuilder()
                        {
                            Description = content,
                            Color = DiscordColors.infoColor,
                            Timestamp = DateTimeOffset.UtcNow
                        };

                        _ = _discordService.SendToAdminChannel(embed: embed.Build());
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

        private void DoCheckNonTag(string serverId, string data)
        {
            var match = outputRegex.Match(data);
            if (!match.Success)
            {
                return;
            }

            string line = match.Groups[1].Value;
            DoCheckSave(serverId, line);
            DoCheckDesync(serverId, line);
        }

        private void DoCheckSave(string serverId, string line)
        {
            if (!line.EndsWith("Saving finished"))
            {
                return;
            }

            if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
            {
                return;
            }

            _factorioFileManager.RaiseRecentTempFiles(serverData);
        }

        private void DoCheckDesync(string serverId, string line)
        {
            if (line.Contains("received playerDesynced peer"))
            {
                _discordService.SendToConnectedChannel(serverId, "**[PLAYER-DESYNCED]**");
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
                MessageType = Models.MessageType.Output,
                Message = data
            };

            _ = SendToFactorioControl(serverId, messageData);

            var t1 = DoTags(serverId, data, dateTime);
            DoCheckNonTag(serverId, data);

            await t1;
        }

        private async Task DoPlayerJoined(string serverId, string name, DateTime dateTime)
        {
            if (name == null)
            {
                return;
            }

            if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
            {
                return;
            }

            LogChat(serverData, $"{Constants.PlayerJoinTag} {name}", dateTime);

            string safeName = SanitizeGameChat(name);
            _ = _discordService.SendToConnectedChannel(serverId, $"**{safeName} has joined the game**");

            await serverData.LockAsync(mutableData =>
            {
                var op = mutableData.OnlinePlayers;
                if (op.TryGetValue(name, out int count))
                {
                    op[name] = count + 1;
                }
                else
                {
                    op.Add(name, 1);
                }

                mutableData.OnlinePlayerCount++;
            });

            _ = _discordService.ScheduleUpdateChannelNameAndTopic(serverId);
        }

        private async Task DoPlayerLeft(string serverId, string content, DateTime dateTime)
        {
            if (string.IsNullOrWhiteSpace(content))
            {
                return;
            }

            if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
            {
                return;
            }

            (string name, string reason) = GetPlayerNameAndReason(content);
            string space = string.IsNullOrWhiteSpace(reason) ? "" : " ";

            LogChat(serverData, $"{Constants.PlayerLeaveTag} {name}{space}{reason}", dateTime);

            string safeName = SanitizeGameChat(name);
            _ = _discordService.SendToConnectedChannel(serverId, $"**{safeName} has left the game{space}{reason}**");

            bool shouldUpdateChannel = await serverData.LockAsync(md =>
            {
                var op = md.OnlinePlayers;
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
                    return false;
                }

                md.OnlinePlayerCount--;
                return true;
            });

            if (shouldUpdateChannel)
            {
                _ = _discordService.ScheduleUpdateChannelNameAndTopic(serverId);
            }
        }

        private async Task DoPlayerQuery(string serverId, string content)
        {
            if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
            {
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

            await serverData.LockAsync(mutableData =>
            {
                var op = mutableData.OnlinePlayers;
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

                mutableData.OnlinePlayerCount = players.Length;
            });

            _ = _discordService.ScheduleUpdateChannelNameAndTopic(serverId);
        }

        private async Task DoTrackedData(string serverId, string content)
        {
            if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
            {
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

            await serverData.LockAsync(mutableData =>
            {
                var td = mutableData.TrackingDataSets;
                td.Clear();
                foreach (var item in dataSets)
                {
                    td.Add(item);
                }
            });
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

            if (data.StartsWith("/ban "))
            {
                ParsedBan? parsedBan = BanParser.FromBanCommand(data, actor);
                if (parsedBan == null)
                {
                    return;
                }

                var command = $"/ban {parsedBan.Username} {parsedBan.Reason}";
                if (command.EndsWith('.'))
                {
                    command = command.Substring(0, command.Length - 1);
                }

                _ = SendToFactorioProcess(serverId, command);

                if (!_factorioServerDataService.TryGetServerData(serverId, out var sourceServerData))
                {
                    return;
                }

                if (!await sourceServerData.LockAsync(md => md.ServerExtraSettings.SyncBans))
                {
                    return;
                }

                await _factorioBanManager.AddBan(parsedBan.ToBan(), serverId, synchronizeWithServers: true, actor);
            }
            else if (data.StartsWith("/unban "))
            {
                string? player = BanParser.NameFromUnBanCommand(data);
                if (player == null)
                {
                    return;
                }

                var command = $"/unban {player}";
                _ = SendToFactorioProcess(serverId, command);

                if (!_factorioServerDataService.TryGetServerData(serverId, out var sourceServerData))
                {
                    return;
                }

                if (!await sourceServerData.LockAsync(md => md.ServerExtraSettings.SyncBans))
                {
                    return;
                }

                await _factorioBanManager.RemoveBan(player, serverId, true, actor);
            }
            else if (data.StartsWith('/'))
            {
                await SendToFactorioProcess(serverId, data);
            }
            else
            {
                if (!_factorioServerDataService.TryGetServerData(serverId, out var sourceServerData))
                {
                    return;
                }

                var messageData = new MessageData()
                {
                    ServerId = serverId,
                    Message = $"[Server] {actor}: {data}",
                    MessageType = Models.MessageType.Output
                };

                LogChat(sourceServerData, messageData.Message, DateTime.UtcNow);

                await sourceServerData.LockAsync(md =>
                {
                    if (md.Status == FactorioServerStatus.Running)
                    {
                        string message = SanitizeDiscordChat(data);
                        string command = $"/silent-command game.print('[Server] {actor}: {message}')";
                        _ = SendToFactorioProcess(serverId, command);

                        FactorioServerUtils.SendMessage(md, _factorioControlHub, messageData);
                    }
                });

                _ = _discordService.SendToConnectedChannel(serverId, messageData.Message);
            }
        }

        private Task DoBan(string serverId, string content)
        {
            if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
            {
                return Task.CompletedTask;
            }

            return _factorioBanManager.DoBanFromGameOutput(serverData, content);
        }

        private Task DoUnBan(string serverId, string content)
        {
            if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
            {
                return Task.CompletedTask;
            }

            return _factorioBanManager.DoUnBanFromGameOutput(serverData, content);
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

            await serverData.LockAsync(md => md.StartTime = DateTime.UtcNow);

            var setStartDataTask = SendToFactorioProcess(serverId, ServerStartDataBuilder.BuildCommand(serverData));
            var serverStartedTask = SendToFactorioProcess(serverId, FactorioCommandBuilder.Static.server_started);

            var embed = new EmbedBuilder()
            {
                Title = "Status:",
                Description = "Server has **started**",
                Color = DiscordColors.successColor,
                Timestamp = DateTimeOffset.UtcNow
            };
            _ = _discordService.SendToConnectedChannel(serverId, embed: embed.Build());

            _ = _discordService.ScheduleUpdateChannelNameAndTopic(serverData.ServerId);

            LogChat(serverData, "[SERVER-STARTED]", dateTime);

            await setStartDataTask;
            await serverStartedTask;
            await ServerConnected(serverData);
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
            await serverData.LockAsync(async mutableData =>
            {
                var callback = mutableData.StopCallback;
                mutableData.StopCallback = null;

                if (callback == null)
                {
                    return;
                }

                await callback(mutableData);
            });
        }

        private Task MarkChannelOffline(FactorioServerData serverData)
        {
            return _discordService.ScheduleUpdateChannelNameAndTopic(serverData.ServerId);
        }

        public async Task StatusChanged(string serverId, FactorioServerStatus newStatus, FactorioServerStatus oldStatus, DateTime dateTime)
        {
            if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
            {
                return;
            }

            FactorioServerStatus recordedOldStatus = await serverData.LockAsync(md =>
            {
                var old = serverData.Status;

                if (newStatus != old)
                {
                    md.Status = newStatus;
                }

                return old;
            });

            Task? serverTask = null;
            bool checkStoppedCallback = false;

            if (oldStatus == FactorioServerStatus.Starting && newStatus == FactorioServerStatus.Running)
            {
                serverTask = ServerStarted(serverData, dateTime);
            }
            else if (newStatus == FactorioServerStatus.Running && recordedOldStatus != FactorioServerStatus.Running)
            {
                serverTask = ServerConnected(serverData);
            }
            else if ((oldStatus == FactorioServerStatus.Stopping && newStatus == FactorioServerStatus.Stopped)
                || (oldStatus == FactorioServerStatus.Killing && newStatus == FactorioServerStatus.Killed))
            {
                var embed = new EmbedBuilder()
                {
                    Title = "Status:",
                    Description = "Server has **stopped**",
                    Color = DiscordColors.infoColor,
                    Timestamp = DateTimeOffset.UtcNow
                };
                _ = _discordService.SendToConnectedChannel(serverId, embed: embed.Build());

                _ = MarkChannelOffline(serverData);

                LogChat(serverData, "[SERVER-STOPPED]", dateTime);

                await serverData.LockAsync(md =>
                {
                    var logger = md.ChatLogger;
                    if (logger != null)
                    {
                        logger.Dispose();
                        md.ChatLogger = null;
                    }
                });

                await _factorioFileManager.RaiseRecentTempFiles(serverData);

                checkStoppedCallback = true;
            }
            else if (newStatus == FactorioServerStatus.Crashed && oldStatus != FactorioServerStatus.Crashed)
            {
                var embed = new EmbedBuilder()
                {
                    Title = "Status:",
                    Description = "Server has **crashed**",
                    Color = DiscordColors.failureColor,
                    Timestamp = DateTimeOffset.UtcNow
                };

                string? mention = null;
                if (oldStatus == FactorioServerStatus.Running)
                {
                    (bool ping, DateTime startTime) = await serverData.LockAsync(md => (md.ServerExtraSettings.PingDiscordCrashRole, md.StartTime));
                    if (ping && (DateTime.UtcNow - startTime) >= crashStartTimeCooldown)
                    {
                        mention = _discordService.CrashRoleMention;
                    }
                }

                _ = _discordService.SendToConnectedChannel(serverId, mention, embed.Build());
                _ = MarkChannelOffline(serverData);

                LogChat(serverData, "[SERVER-CRASHED]", dateTime);

                await serverData.LockAsync(md =>
                {
                    var logger = md.ChatLogger;
                    if (logger != null)
                    {
                        logger.Dispose();
                        md.ChatLogger = null;
                    }
                });
            }

            var groups = _factorioControlHub.Clients.Group(serverId);
            Task contorlTask1 = groups.FactorioStatusChanged(newStatus.ToString(), oldStatus.ToString());

            Task? controlTask2 = null;
            if (newStatus != oldStatus)
            {
                var messageData = new MessageData()
                {
                    ServerId = serverId,
                    MessageType = Models.MessageType.Status,
                    Message = $"[STATUS]: Changed from {oldStatus} to {newStatus}"
                };

                _ = serverData.LockAsync(md => md.ControlMessageBuffer.Add(messageData));
                controlTask2 = groups.SendMessage(messageData);
            }

            if (serverTask != null)
                await serverTask;
            if (contorlTask1 != null)
                await contorlTask1;
            if (controlTask2 != null)
                await controlTask2;
            if (checkStoppedCallback)
                await DoStoppedCallback(serverData);
        }

        public Task OnProcessRegistered(string serverId)
        {
            return _factorioProcessHub.Clients.Group(serverId).GetStatus();
        }

        private async Task<FactorioServerSettings> GetServerSettings(FactorioServerMutableData mutableData)
        {
            var settings = mutableData.ServerSettings;

            if (settings != null)
            {
                return settings;
            }

            var fi = new FileInfo(mutableData.ServerSettingsPath);

            if (!fi.Exists)
            {
                settings = FactorioServerSettings.MakeDefault(_configuration);

                var data = JsonConvert.SerializeObject(settings, Formatting.Indented);
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
                    settings = JsonConvert.DeserializeObject<FactorioServerSettings>(output);
                }
            }

            mutableData.ServerSettings = settings;

            return settings;
        }

        private async Task<string[]> GetServerAdminList(FactorioServerMutableData mutableData)
        {
            var adminList = mutableData.ServerAdminList;

            if (adminList != null)
            {
                return adminList;
            }

            var fi = new FileInfo(mutableData.ServerAdminListPath);

            if (!fi.Exists)
            {
                var a = await _factorioAdminService.GetAdmins();
                adminList = a.Select(x => x.Name).ToArray();

                var data = JsonConvert.SerializeObject(adminList, Formatting.Indented);
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
                    adminList = JsonConvert.DeserializeObject<string[]>(output);
                }
            }

            mutableData.ServerAdminList = adminList;

            return adminList;
        }

        private FactorioServerSettingsWebEditable MakeEditableSettingsFromSettings(FactorioServerSettings settings, string[] adminList)
        {
            return new FactorioServerSettingsWebEditable()
            {
                Name = settings.Name,
                Description = settings.Description,
                Tags = settings.Tags,
                MaxPlayers = settings.MaxPlayers,
                GamePassword = settings.GamePassword,
                MaxUploadSlots = settings.MaxUploadSlots,
                AutoPause = settings.AutoPause,
                UseDefaultAdmins = settings.UseDefaultAdmins,
                Admins = adminList,
                AutosaveInterval = settings.AutosaveInterval,
                AutosaveSlots = settings.AutosaveSlots,
                AfkAutokickInterval = settings.AfkAutokickInterval,
                NonBlockingSaving = settings.NonBlockingSaving,
                PublicVisible = settings.Visibility.Public
            };
        }

        public async Task<(FactorioServerSettingsWebEditable? settings, bool saved)> GetEditableServerSettings(string serverId)
        {
            if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
            {
                return (null, false);
            }

            return await serverData.LockAsync(async mutableData =>
            {
                var editableSettings = mutableData.ServerWebEditableSettings;
                if (editableSettings != null)
                {
                    return (editableSettings, mutableData.ServerSettingsSaved);
                }

                var serverSettings = await GetServerSettings(mutableData);
                var adminList = await GetServerAdminList(mutableData);

                editableSettings = MakeEditableSettingsFromSettings(serverSettings, adminList);

                mutableData.ServerWebEditableSettings = editableSettings;

                return (editableSettings, mutableData.ServerSettingsSaved);
            });
        }

        public async Task<Result> SaveEditableServerSettings(string serverId, FactorioServerSettingsWebEditable settings)
        {
            if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
            {
                return Result.Failure(Constants.UnexpectedErrorKey);
            }

            settings.Tags = settings.Tags.Select(x => x.Replace(' ', '\u00a0')).ToArray(); // \u00a0 is &nbsp;. Factorio splits tags on space, but not on &nbsp;.
            settings.MaxPlayers = settings.MaxPlayers < 0 ? 0 : settings.MaxPlayers;
            settings.MaxUploadSlots = settings.MaxUploadSlots < 0 ? 0 : settings.MaxUploadSlots;
            settings.AutosaveSlots = settings.AutosaveSlots < 0 ? 0 : settings.AutosaveSlots;
            settings.AutosaveInterval = settings.AutosaveInterval < 1 ? 1 : settings.AutosaveInterval;
            settings.AfkAutokickInterval = settings.AfkAutokickInterval < 0 ? 0 : settings.AfkAutokickInterval;

            async Task<Result> Inner(FactorioServerMutableData md)
            {
                var serverSettigns = await GetServerSettings(md);

                serverSettigns.Name = settings.Name;
                serverSettigns.Description = settings.Description;
                serverSettigns.Tags = settings.Tags;
                serverSettigns.MaxPlayers = settings.MaxPlayers;
                serverSettigns.GamePassword = settings.GamePassword;
                serverSettigns.MaxUploadSlots = settings.MaxUploadSlots;
                serverSettigns.AutoPause = settings.AutoPause;
                serverSettigns.UseDefaultAdmins = settings.UseDefaultAdmins;
                serverSettigns.AutosaveSlots = settings.AutosaveSlots;
                serverSettigns.AutosaveInterval = settings.AutosaveInterval;
                serverSettigns.AfkAutokickInterval = settings.AfkAutokickInterval;
                serverSettigns.NonBlockingSaving = settings.NonBlockingSaving;
                serverSettigns.Visibility.Public = settings.PublicVisible;

                string[] admins;

                if (!settings.UseDefaultAdmins)
                {
                    admins = settings.Admins.Select(x => x.Trim())
                        .Where(x => !string.IsNullOrWhiteSpace(x))
                        .ToArray();
                }
                else
                {
                    var a = await _factorioAdminService.GetAdmins();
                    admins = a.Select(x => x.Name).ToArray();
                }

                settings.Admins = admins;

                md.ServerSettings = serverSettigns;
                md.ServerAdminList = admins;
                md.ServerWebEditableSettings = settings;
                md.ServerSettingsSaved = true;

                var settingsData = JsonConvert.SerializeObject(serverSettigns, Formatting.Indented);
                var adminData = JsonConvert.SerializeObject(admins, Formatting.Indented);

                await File.WriteAllTextAsync(serverData.ServerSettingsPath, settingsData);
                await File.WriteAllTextAsync(serverData.ServerAdminListPath, adminData);

                return Result.OK;
            }

            Result result;
            try
            {
                result = await serverData.LockAsync(Inner);
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Exception saving server settings.");
                result = Result.Failure(Constants.UnexpectedErrorKey);
            }

            if (result.Success)
            {
                _ = _factorioControlHub.Clients.Group(serverId).SendServerSettings(settings, true);
            }

            return result;
        }

        private async Task<FactorioServerExtraSettings> GetServerExtraSettings(FactorioServerMutableData mutableData)
        {
            var settings = mutableData.ServerExtraSettings;

            var fi = new FileInfo(mutableData.ServerExtraSettingsPath);

            if (!fi.Exists)
            {
                var data = JsonConvert.SerializeObject(settings, Formatting.Indented);
                using (var fs = fi.CreateText())
                {
                    await fs.WriteAsync(data);
                    await fs.FlushAsync();
                }
            }

            return settings;
        }

        public async Task<(FactorioServerExtraSettings? settings, bool saved)> GetEditableServerExtraSettings(string serverId)
        {
            if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
            {
                return (null, false);
            }

            return await serverData.LockAsync(async mutableData =>
            {
                var settings = mutableData.ServerExtraWebEditableSettings;
                if (settings != null)
                {
                    return (settings, mutableData.ServerExtraSettingsSaved);
                }

                settings = await GetServerExtraSettings(mutableData);
                var copy = settings.Copy();

                mutableData.ServerExtraWebEditableSettings = copy;
                return (copy, mutableData.ServerExtraSettingsSaved);
            });
        }

        public async Task<Result> SaveEditableExtraServerSettings(string serverId, FactorioServerExtraSettings settings)
        {
            if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
            {
                return Result.Failure(Constants.UnexpectedErrorKey);
            }

            async Task<Result> Inner(FactorioServerMutableData mutableData)
            {
                mutableData.ServerExtraSettings = settings;
                mutableData.ServerExtraWebEditableSettings = settings.Copy();
                mutableData.ServerExtraSettingsSaved = true;

                string data = JsonConvert.SerializeObject(settings, Formatting.Indented);
                await File.WriteAllTextAsync(serverData.ServerExtraSettingsPath, data);

                return Result.OK;
            }

            Result result;
            try
            {
                result = await serverData.LockAsync(Inner);
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Exception saving server extra settings.");
                result = Result.Failure(Constants.UnexpectedErrorKey);
            }

            if (result.Success)
            {
                _ = _factorioControlHub.Clients.Group(serverId).SendServerExtraSettings(settings, true);
            }

            return result;
        }

        public async Task UpdateServerSettings(KeyValueCollectionChangedData<string, object> data, string serverId, string connectionId)
        {
            if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
            {
                return;
            }

            if (data.Type != CollectionChangeType.Add)
            {
                return;
            }

            void DoUpdate(FactorioServerMutableData mutableData)
            {
                mutableData.ServerSettingsSaved = false;

                var settings = mutableData.ServerWebEditableSettings;

                if (settings == null)
                {
                    return;
                }

                foreach (var keyValuePair in data.NewItems)
                {
                    var value = keyValuePair.Value;
                    switch (keyValuePair.Key)
                    {
                        case nameof(FactorioServerSettingsWebEditable.Name):
                            settings.Name = value as string ?? "";
                            break;
                        case nameof(FactorioServerSettingsWebEditable.Description):
                            settings.Description = value as string ?? "";
                            break;
                        case nameof(FactorioServerSettingsWebEditable.Tags):
                            {
                                var input = value as object[] ?? Array.Empty<object>();
                                settings.Tags = Array.ConvertAll(input, x => x as string ?? "");
                                break;
                            }
                        case nameof(FactorioServerSettingsWebEditable.MaxPlayers):
                            settings.MaxPlayers = value as int? ?? 0;
                            break;
                        case nameof(FactorioServerSettingsWebEditable.GamePassword):
                            settings.GamePassword = value as string ?? "";
                            break;
                        case nameof(FactorioServerSettingsWebEditable.MaxUploadSlots):
                            settings.MaxUploadSlots = value as int? ?? 32;
                            break;
                        case nameof(FactorioServerSettingsWebEditable.AutoPause):
                            settings.AutoPause = value as bool? ?? true;
                            break;
                        case nameof(FactorioServerSettingsWebEditable.UseDefaultAdmins):
                            settings.UseDefaultAdmins = value as bool? ?? true;
                            break;
                        case nameof(FactorioServerSettingsWebEditable.Admins):
                            {
                                var input = value as object[] ?? Array.Empty<object>();
                                settings.Admins = Array.ConvertAll(input, x => x as string ?? "");
                                break;
                            }
                        case nameof(FactorioServerSettingsWebEditable.AutosaveInterval):
                            settings.AutosaveInterval = value as int? ?? 5;
                            break;
                        case nameof(FactorioServerSettingsWebEditable.AutosaveSlots):
                            settings.AutosaveSlots = value as int? ?? 20;
                            break;
                        case nameof(FactorioServerSettingsWebEditable.AfkAutokickInterval):
                            settings.AfkAutokickInterval = value as int? ?? 0;
                            break;
                        case nameof(FactorioServerSettingsWebEditable.NonBlockingSaving):
                            settings.NonBlockingSaving = value as bool? ?? false;
                            break;
                        case nameof(FactorioServerSettingsWebEditable.PublicVisible):
                            settings.PublicVisible = value as bool? ?? true;
                            break;
                        default:
                            break;
                    }
                }
            }

            await serverData.LockAsync(DoUpdate);

            _ = _factorioControlHub.Clients.GroupExcept(serverId, connectionId).SendServerSettingsUpdate(data, true);
        }

        public async Task UpdateServerExtraSettings(KeyValueCollectionChangedData<string, object> data, string serverId, string connectionId)
        {
            if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
            {
                return;
            }

            if (data.Type != CollectionChangeType.Add)
            {
                return;
            }

            void DoUpdate(FactorioServerMutableData mutableData)
            {
                mutableData.ServerExtraSettingsSaved = false;

                var settings = mutableData.ServerExtraWebEditableSettings;

                if (settings == null)
                {
                    return;
                }

                foreach (var keyValuePair in data.NewItems)
                {
                    var value = keyValuePair.Value as bool? ?? true;
                    switch (keyValuePair.Key)
                    {
                        case nameof(FactorioServerExtraSettings.SyncBans):
                            settings.SyncBans = value;
                            break;
                        case nameof(FactorioServerExtraSettings.BuildBansFromDatabaseOnStart):
                            settings.BuildBansFromDatabaseOnStart = value;
                            break;
                        case nameof(FactorioServerExtraSettings.SetDiscordChannelName):
                            settings.SetDiscordChannelName = value;
                            break;
                        case nameof(FactorioServerExtraSettings.SetDiscordChannelTopic):
                            settings.SetDiscordChannelTopic = value;
                            break;
                        case nameof(FactorioServerExtraSettings.GameChatToDiscord):
                            settings.GameChatToDiscord = value;
                            break;
                        case nameof(FactorioServerExtraSettings.GameShoutToDiscord):
                            settings.GameShoutToDiscord = value;
                            break;
                        case nameof(FactorioServerExtraSettings.DiscordToGameChat):
                            settings.DiscordToGameChat = value;
                            break;
                        case nameof(FactorioServerExtraSettings.PingDiscordCrashRole):
                            settings.PingDiscordCrashRole = value;
                            break;
                        default:
                            break;
                    }
                }
            }

            await serverData.LockAsync(DoUpdate);

            _ = _factorioControlHub.Clients.GroupExcept(serverId, connectionId).SendServerExtraSettingsUpdate(data, true);
        }

        public async Task UndoServerSettings(string serverId)
        {
            if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
            {
                return;
            }

            async Task<FactorioServerSettingsWebEditable> DoUndo(FactorioServerMutableData mutableData)
            {
                var serverSettings = await GetServerSettings(mutableData);
                var adminList = await GetServerAdminList(mutableData);

                var newSettings = MakeEditableSettingsFromSettings(serverSettings, adminList);

                mutableData.ServerWebEditableSettings = newSettings;
                mutableData.ServerSettingsSaved = true;

                return newSettings;
            }

            FactorioServerSettingsWebEditable settings = await serverData.LockAsync(DoUndo);

            _ = _factorioControlHub.Clients.Group(serverId).SendServerSettings(settings, true);
        }

        public async Task UndoServerExtraSettings(string serverId)
        {
            if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
            {
                return;
            }

            FactorioServerExtraSettings DoUndo(FactorioServerMutableData mutableData)
            {
                var newSettings = mutableData.ServerExtraSettings.Copy();

                mutableData.ServerExtraWebEditableSettings = newSettings;
                mutableData.ServerExtraSettingsSaved = true;

                return newSettings;
            }

            FactorioServerExtraSettings settings = await serverData.LockAsync(DoUndo);

            _ = _factorioControlHub.Clients.Group(serverId).SendServerExtraSettings(settings, true);
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
                        SaveDeflater.Deflate(newFilePath);

                        _factorioControlHub.Clients.Clients(connectionId).DeflateFinished(Result.OK);
                    }
                    catch (Exception e)
                    {
                        _logger.LogError(e, "Error deflating file {fileName}.", fileName);
                        _factorioControlHub.Clients.Clients(connectionId).DeflateFinished(Result.Failure(Constants.FileErrorKey, $"Error deflating {serverId}/{directoryName}/{newFileInfo.Name}."));
                    }
                    finally
                    {
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

        public Task<string[]> GetCachedVersions()
        {
            return Task.FromResult(_factorioUpdater.GetCachedVersions());
        }

        public bool DeleteCachedVersion(string version)
        {
            return _factorioUpdater.DeleteCachedFile(version);
        }

        public string GetVersion(string serverId)
        {
            if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
            {
                return "";
            }

            return serverData.Version;
        }

        private void LogChat(FactorioServerData serverData, string content, DateTime dateTime)
        {
            void SafeLog(Logger logger, string c, DateTime dt, ILogger<FactorioServerManager> expectionLogger)
            {
                try
                {
                    logger.Information("{dateTime} {content}", dt.ToString("yyyy-MM-dd HH:mm:ss"), c);
                }
                catch (Exception e)
                {
                    expectionLogger.LogError(e, "content: {content}", c);
                }
            }

            var chatLogger = serverData.ChatLogger;

            if (chatLogger != null)
            {
                SafeLog(chatLogger, content, dateTime, _logger);
                return;
            }

            _ = serverData.LockAsync(mutableData =>
            {
                var newLogger = mutableData.ChatLogger;
                if (newLogger != null)
                {
                    SafeLog(newLogger, content, dateTime, _logger);
                    return;
                }

                newLogger = FactorioServerMutableData.BuildChatLogger(mutableData.ChatLogCurrentPath);
                mutableData.ChatLogger = newLogger;

                SafeLog(newLogger, content, dateTime, _logger);
            });
        }

        public async Task<string?> GetSelectedModPack(string serverId)
        {
            if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
            {
                return null;
            }

            return await serverData.LockAsync(md => md.ModPack);
        }

        public Task SetSelectedModPack(string serverId, string modPack)
        {
            if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
            {
                return Task.CompletedTask;
            }

            return serverData.LockAsync(md =>
            {
                md.ModPack = modPack;

                _ = _factorioControlHub.Clients.Group(md.ServerId).SendSelectedModPack(modPack);

                return _factorioFileManager.SaveServerExtraData(md);
            });
        }

        public FileMetaData[] GetTempSaveFiles(string serverId)
        {
            if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
            {
                return Array.Empty<FileMetaData>();
            }

            return _factorioFileManager.GetTempSaveFiles(serverData.TempSavesDirectoryPath);
        }

        public FileMetaData[] GetLocalSaveFiles(string serverId)
        {
            if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
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
            if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
            {
                return new List<FileMetaData>(0);
            }

            return _factorioFileManager.GetLogs(serverData);
        }

        public List<FileMetaData> GetChatLogs(string serverId)
        {
            if (!_factorioServerDataService.TryGetServerData(serverId, out var serverData))
            {
                return new List<FileMetaData>(0);
            }

            return _factorioFileManager.GetChatLogs(serverData);
        }

        private static (string channelName, string message)? SplitNamedChannelDiscordMessage(string content)
        {
            int space = content.IndexOf(' ');
            if (space < 0)
            {
                return null;
            }

            int rest = content.Length - space - 1;
            if (rest < 1)
            {
                return null;
            }

            string name = content.Substring(0, space);
            string message = content.Substring(space + 1, rest);

            return (name, message);
        }

        private static (string name, string reason) GetPlayerNameAndReason(string content)
        {
            int space = content.IndexOf(' ');
            if (space < 0)
            {
                return (content, "");
            }

            int rest = content.Length - space - 1;
            if (rest < 1)
            {
                return (content, "");
            }

            string name = content.Substring(0, space);
            string reason = content.Substring(space + 1, rest);

            return (name, reason);
        }
    }
}
