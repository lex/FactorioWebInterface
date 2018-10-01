﻿using DSharpPlus;
using DSharpPlus.Entities;
using FactorioWebInterface.Data;
using FactorioWebInterface.Hubs;
using FactorioWrapperInterface;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace FactorioWebInterface.Models
{
    public class FactorioServerManager : IFactorioServerManager
    {
        // Match on first [*] and capture everything after.
        private static readonly Regex tag_regex = new Regex(@"(\[[^\[\]]+\])\s*((?:.|\s)*)\s*", RegexOptions.Compiled);

        private readonly IDiscordBot _discordBot;
        private readonly IHubContext<FactorioProcessHub, IFactorioProcessClientMethods> _factorioProcessHub;
        private readonly IHubContext<FactorioControlHub, IFactorioControlClientMethods> _factorioControlHub;
        private readonly DbContextFactory _dbContextFactory;
        private readonly ILogger<FactorioServerManager> _logger;

        //private SemaphoreSlim serverLock = new SemaphoreSlim(1, 1);
        private Dictionary<string, FactorioServerData> servers = FactorioServerData.Servers;

        public FactorioServerManager
        (
            IDiscordBot discordBot,
            IHubContext<FactorioProcessHub, IFactorioProcessClientMethods> factorioProcessHub,
            IHubContext<FactorioControlHub, IFactorioControlClientMethods> factorioControlHub,
            DbContextFactory dbContextFactory,
            ILogger<FactorioServerManager> logger
        )
        {
            _discordBot = discordBot;
            _factorioProcessHub = factorioProcessHub;
            _factorioControlHub = factorioControlHub;
            _dbContextFactory = dbContextFactory;
            _logger = logger;

            _discordBot.FactorioDiscordDataReceived += FactorioDiscordDataReceived;
        }

        private string SanitizeDiscordChat(string message)
        {
            StringBuilder sb = new StringBuilder(message);

            sb.Replace("'", "\\'");
            sb.Replace("\n", " ");

            return sb.ToString();
        }

        private void FactorioDiscordDataReceived(IDiscordBot sender, ServerMessageEventArgs eventArgs)
        {
            var name = SanitizeDiscordChat(eventArgs.User.Username);
            var message = SanitizeDiscordChat(eventArgs.Message);

            string data = $"/silent-command game.print('[Discord] {name}: {message}')";
            SendToFactorioProcess(eventArgs.ServerId, data);

            var messageData = new MessageData()
            {
                MessageType = MessageType.Discord,
                Message = $"[Discord] {eventArgs.User.Username}: {eventArgs.Message}"
            };

            _ = SendToFactorioControl(eventArgs.ServerId, messageData);
        }

        public bool Start(string serverId)
        {
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknow serverId: {serverId}", serverId);
                return false;
            }

            string basePath = serverData.BaseDirectoryPath;

            var startInfo = new ProcessStartInfo
            {
                FileName = "/usr/bin/dotnet",
                Arguments = $"/factorio/factorioWrapper/FactorioWrapper.dll {serverId} {basePath}bin/x64/factorio --start-server-load-latest --server-settings {basePath}server-settings.json --port {serverData.Port}",
                //FileName = "C:/Program Files/dotnet/dotnet.exe",
                //Arguments = $"C:/Projects/FactorioWebInterface/FactorioWrapper/bin/Release/netcoreapp2.1/publish/FactorioWrapper.dll {serverId} C:/factorio/Factorio1/bin/x64/factorio.exe --start-server C:/factorio/Factorio1/bin/x64/test.zip --server-settings C:/factorio/Factorio1/bin/x64/server-settings.json",

                UseShellExecute = false,
                CreateNoWindow = true
            };

            try
            {
                Process.Start(startInfo);
            }
            catch (Exception)
            {
                _logger.LogError("Error starting serverId: {serverId}", serverId);
                return false;
            }

            _logger.LogInformation("Server started serverId: {serverId}", serverId);
            return true;
        }

        public bool Load(string serverId, string saveFilePath)
        {
            throw new System.NotImplementedException();
        }

        public void Stop(string serverId)
        {
            _factorioProcessHub.Clients.Groups(serverId).Stop();
        }

        public void ForceStop(string serverId)
        {
            _factorioProcessHub.Clients.Groups(serverId).ForceStop();
        }

        public async Task<FactorioServerStatus> GetStatus(string serverId)
        {
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknow serverId: {serverId}", serverId);
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

        public void FactorioDataReceived(string serverId, string data)
        {
            if (data == null)
            {
                return;
            }

            var messageData = new MessageData()
            {
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
                case "[CHAT]":
                    content = Formatter.Sanitize(content);
                    _discordBot.SendToFactorioChannel(serverId, content);
                    break;
                case "[DISCORD]":
                    content = content.Replace("\\n", "\n");
                    content = Formatter.Sanitize(content);
                    _discordBot.SendToFactorioChannel(serverId, content);
                    break;
                case "[DISCORD-RAW]":
                    content = content.Replace("\\n", "\n");
                    _discordBot.SendToFactorioChannel(serverId, content);
                    break;
                case "[DISCORD-ADMIN]":
                    content = content.Replace("\\n", "\n");
                    content = Formatter.Sanitize(content);
                    _discordBot.SendToFactorioAdminChannel(content);
                    break;
                case "[DISCORD-ADMIN-RAW]":
                    content = content.Replace("\\n", "\n");
                    _discordBot.SendToFactorioAdminChannel(content);
                    break;
                case "[JOIN]":
                    content = Formatter.Sanitize(content);
                    _discordBot.SendToFactorioChannel(serverId, "**" + content + "**");
                    break;
                case "[LEAVE]":
                    content = Formatter.Sanitize(content);
                    _discordBot.SendToFactorioChannel(serverId, "**" + content + "**");
                    break;
                case "[DISCORD-EMBED]":
                    {
                        content = content.Replace("\\n", "\n");
                        content = Formatter.Sanitize(content);

                        var embed = new DiscordEmbedBuilder()
                        {
                            Description = content,
                            Color = DiscordBot.infoColor
                        };

                        _discordBot.SendEmbedToFactorioChannel(serverId, embed);
                        break;
                    }
                case "[DISCORD-EMBED-RAW]":
                    {
                        content = content.Replace("\\n", "\n");

                        var embed = new DiscordEmbedBuilder()
                        {
                            Description = content,
                            Color = DiscordBot.infoColor
                        };

                        _discordBot.SendEmbedToFactorioChannel(serverId, embed);
                        break;
                    }

                case "[DISCORD-ADMIN-EMBED]":
                    {
                        content = content.Replace("\\n", "\n");
                        content = Formatter.Sanitize(content);

                        var embed = new DiscordEmbedBuilder()
                        {
                            Description = content,
                            Color = DiscordBot.infoColor
                        };

                        _discordBot.SendEmbedToFactorioAdminChannel(embed);
                        break;
                    }
                case "[DISCORD-ADMIN-EMBED-RAW]":
                    {
                        content = content.Replace("\\n", "\n");

                        var embed = new DiscordEmbedBuilder()
                        {
                            Description = content,
                            Color = DiscordBot.infoColor
                        };

                        _discordBot.SendEmbedToFactorioAdminChannel(embed);
                        break;
                    }
                default:
                    break;
            }
        }

        public void FactorioWrapperDataReceived(string serverId, string data)
        {
            var messageData = new MessageData()
            {
                MessageType = MessageType.Wrapper,
                Message = data
            };

            _ = SendToFactorioControl(serverId, messageData);
        }

        private async Task ServerStarted(string serverId)
        {
            var embed = new DiscordEmbedBuilder()
            {
                Description = "Server has started",
                Color = DiscordBot.successColor
            };
            var t1 = _discordBot.SendEmbedToFactorioChannel(serverId, embed);

            List<Regular> regulars;
            using (var db = _dbContextFactory.Create())
            {
                regulars = await db.Regulars.ToListAsync();
            }

            var sb = new StringBuilder("/silent-command local r = global.regulars local t = {");
            foreach (var regualr in regulars)
            {
                sb.Append('\'');
                sb.Append(regualr.Name);
                sb.Append('\'');
                sb.Append(',');
            }
            sb.Remove(sb.Length - 1, 1);
            sb.Append("} for k,v in ipairs(t) do r[v] = true end");

            string command = sb.ToString();
            await SendToFactorioProcess(serverId, command);
            await t1;
        }

        public async Task StatusChanged(string serverId, FactorioServerStatus newStatus, FactorioServerStatus oldStatus)
        {
            if (!servers.TryGetValue(serverId, out var serverData))
            {
                _logger.LogError("Unknow serverId: {serverId}", serverId);
                return;
            }

            try
            {
                await serverData.ServerLock.WaitAsync();
                serverData.Status = newStatus;
            }
            finally
            {
                serverData.ServerLock.Release();
            }

            if (newStatus == oldStatus)
            {
                return;
            }

            Task discordTask = null;
            if (oldStatus == FactorioServerStatus.Unknown)
            {
                // Do nothing.
            }
            if (oldStatus == FactorioServerStatus.Starting && newStatus == FactorioServerStatus.Running)
            {
                discordTask = ServerStarted(serverId);
            }
            else if (oldStatus == FactorioServerStatus.Stopping && newStatus == FactorioServerStatus.Stopped
                || oldStatus == FactorioServerStatus.Killing && newStatus == FactorioServerStatus.Killed)
            {
                var embed = new DiscordEmbedBuilder()
                {
                    Description = "Server has stopped",
                    Color = DiscordBot.infoColor
                };
                discordTask = _discordBot.SendEmbedToFactorioChannel(serverId, embed);
            }
            else if (newStatus == FactorioServerStatus.Crashed)
            {
                var embed = new DiscordEmbedBuilder()
                {
                    Description = "Server has crashed",
                    Color = DiscordBot.failureColor
                };
                discordTask = _discordBot.SendEmbedToFactorioChannel(serverId, embed);
            }

            var contorlTask1 = _factorioControlHub.Clients.Group(serverId).FactorioStatusChanged(newStatus.ToString(), oldStatus.ToString());

            var messageData = new MessageData()
            {
                MessageType = MessageType.Status,
                Message = $"[STATUS]: Changed from {oldStatus} to {newStatus}"
            };

            var controlTask2 = SendToFactorioControl(serverId, messageData);

            if (discordTask != null)
            {
                await discordTask;
            }
            await contorlTask1;
            await controlTask2;
        }

        public async Task<List<Regular>> GetRegularsAsync()
        {
            var db = _dbContextFactory.Create();
            return await db.Regulars.ToListAsync();
        }

        public async Task AddRegularsFromStringAsync(string data)
        {
            var db = _dbContextFactory.Create();
            var regulars = db.Regulars;

            var names = data.Split(',').Select(x => x.Trim());
            foreach (var name in names)
            {
                var regular = new Regular()
                {
                    Name = name,
                    Date = DateTimeOffset.Now,
                    PromotedBy = "<From old list>"
                };
                regulars.Add(regular);
            }

            await db.SaveChangesAsync();
        }
    }
}
