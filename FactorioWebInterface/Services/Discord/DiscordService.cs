using Discord;
using FactorioWebInterface.Data;
using FactorioWebInterface.Models;
using FactorioWebInterface.Utils;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace FactorioWebInterface.Services.Discord
{
    public interface IDiscordService
    {
        string? CrashRoleMention { get; }

        Task<bool> IsAdminRoleAsync(ulong userId);
        Task<bool> IsAdminRoleAsync(string userId);
        Task<Result> SetServer(string serverId, ulong channelId);
        Task<Result> SetAdminChannel(ulong channelId);
        Task<Result<string?>> UnSetServer(ulong channelId);
        Task SendToConnectedChannel(string serverId, string? text = null, Embed? embed = null);
        Task SendToAdminChannel(string? text = null, Embed? embed = null);
        Task ScheduleUpdateChannelNameAndTopic(string serverId);

        Task Init();

        event EventHandler<IDiscordService, ServerMessageEventArgs>? FactorioDiscordDataReceived;
    }

    public class DiscordService : IDiscordService
    {
        private readonly IDiscordClientWrapper _client;
        private readonly IDbContextFactory _dbContextFactory;
        private readonly IFactorioServerDataService _factorioServerDataService;
        private readonly ILogger<DiscordService> _logger;
        private readonly IMessageQueueFactory _messageQueueFactory;
        private readonly IChannelUpdaterFactory _channelUpdaterFactory;

        private readonly ulong guildId;
        private readonly HashSet<ulong> validAdminRoleIds = new HashSet<ulong>();

        private readonly SemaphoreSlim discordLock = new SemaphoreSlim(1, 1);
        private readonly Dictionary<ulong, string> discordToServer = new Dictionary<ulong, string>();
        private readonly Dictionary<string, ulong> serverdToDiscord = new Dictionary<string, ulong>();

        private readonly Dictionary<ulong, IMessageQueue> messageQueues = new Dictionary<ulong, IMessageQueue>();
        private readonly Dictionary<ulong, IChannelUpdater> channelUpdaters = new Dictionary<ulong, IChannelUpdater>();

        public string? CrashRoleMention { get; }

        public event EventHandler<IDiscordService, ServerMessageEventArgs>? FactorioDiscordDataReceived;

        public DiscordService(IDiscordServiceConfiguration configuration,
            IDiscordClientWrapper client,
            IDiscordMessageHandlingService messageService,
            IDbContextFactory dbContextFactory,
            IFactorioServerDataService factorioServerDataService,
            ILogger<DiscordService> logger,
            IMessageQueueFactory messageQueueFactory,
            IChannelUpdaterFactory channelUpdaterFactory)
        {
            _client = client;
            _dbContextFactory = dbContextFactory;
            _factorioServerDataService = factorioServerDataService;
            _logger = logger;
            _messageQueueFactory = messageQueueFactory;
            _channelUpdaterFactory = channelUpdaterFactory;

            guildId = configuration.GuildId;
            validAdminRoleIds = configuration.AdminRoleIds;

            ulong crashRoleId = configuration.CrashRoleId;
            if (crashRoleId != 0)
            {
                CrashRoleMention = MentionUtils.MentionRole(crashRoleId);
            }

            messageService.MessageReceived += MessageReceived;
        }

        public async Task Init()
        {
            using (var context = _dbContextFactory.Create<ApplicationDbContext>())
            {
                var servers = context.DiscordServers.AsQueryable().ToArrayAsync();

                foreach (var ds in await servers)
                {
                    discordToServer[ds.DiscordChannelId] = ds.ServerId;
                    serverdToDiscord[ds.ServerId] = ds.DiscordChannelId;
                }
            }
        }

        /// <summary>
        /// Returns a boolean for if the discord user has the admin-like role in the Redmew guild.
        /// </summary>
        /// <param name="userId">The discord user's id.</param>        
        public async Task<bool> IsAdminRoleAsync(ulong userId)
        {
            var guild = _client.GetGuild(guildId);
            if (guild == null)
            {
                return false;
            }

            var user = await guild.GetUserAsync(userId);
            if (user == null)
            {
                return false;
            }

            return user.RoleIds.Any(id => validAdminRoleIds.Contains(id));
        }

        /// <summary>
        /// Returns a boolean for if the discord user has the admin-like role in the Redmew guild.
        /// </summary>
        /// <param name="userId">The discord user's id.</param> 
        public Task<bool> IsAdminRoleAsync(string userId)
        {
            if (ulong.TryParse(userId, out ulong id))
                return IsAdminRoleAsync(id);
            else
                return Task.FromResult(false);
        }

        public Task<Result> SetServer(string serverId, ulong channelId)
        {
            if (!_factorioServerDataService.IsValidServerId(serverId))
            {
                return Task.FromResult(Result.Failure(Constants.ServerIdErrorKey, $"The serverID {serverId} was not found."));
            }

            return SetServerInner(serverId, channelId);
        }

        public Task<Result> SetAdminChannel(ulong channelId)
        {
            return SetServerInner(Constants.AdminChannelID, channelId);
        }

        public async Task<Result<string?>> UnSetServer(ulong channelId)
        {
            try
            {
                await discordLock.WaitAsync();

                using (var context = _dbContextFactory.Create<ApplicationDbContext>())
                {
                    DiscordServers[] query = await context.DiscordServers.AsQueryable().Where(x => x.DiscordChannelId == channelId).ToArrayAsync();

                    string? serverId = null;

                    foreach (var ds in query)
                    {
                        serverdToDiscord.Remove(ds.ServerId);
                        discordToServer.Remove(ds.DiscordChannelId);
                        context.DiscordServers.Remove(ds);

                        if (messageQueues.TryGetValue(ds.DiscordChannelId, out var messageQueue))
                        {
                            messageQueues.Remove(ds.DiscordChannelId);
                            messageQueue.Dispose();
                        }

                        if (channelUpdaters.TryGetValue(ds.DiscordChannelId, out var channelUpdater))
                        {
                            channelUpdaters.Remove(ds.DiscordChannelId);
                            channelUpdater.Dispose();
                        }

                        serverId = ds.ServerId;
                    }

                    await context.SaveChangesAsync();

                    if (serverId == null)
                    {
                        return Result<string?>.Failure(Constants.ServerIdErrorKey, "No server was found for the channel.");
                    }

                    return Result<string?>.OK(serverId);
                }
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(UnSetServer));
                return Result<string?>.Failure(Constants.UnexpectedErrorKey, "An unexpected error occurred.");
            }
            finally
            {
                discordLock.Release();
            }
        }

        public async Task SendToConnectedChannel(string serverId, string? text = null, Embed? embed = null)
        {
            var messageQueue = await GetMessageQueue(serverId);
            if (messageQueue == null)
            {
                return;
            }

            if (text?.Length > Constants.discordMaxMessageLength)
            {
                text = text.Substring(0, Constants.discordMaxMessageLength);
            }

            messageQueue.Enqueue(text, embed);
        }

        public Task SendToAdminChannel(string? text = null, Embed? embed = null)
        {
            return SendToConnectedChannel(Constants.AdminChannelID, text, embed);
        }

        public async Task ScheduleUpdateChannelNameAndTopic(string serverId)
        {
            var channelUpdater = await GetChannelUpdater(serverId);
            if (channelUpdater == null)
            {
                return;
            }

            channelUpdater.ScheduleUpdate();
        }

        private async Task<Result> SetServerInner(string serverId, ulong channelId)
        {
            try
            {
                await discordLock.WaitAsync();

                using (var context = _dbContextFactory.Create<ApplicationDbContext>())
                {
                    DiscordServers[] query = await context.DiscordServers.AsQueryable().Where(x => x.DiscordChannelId == channelId || x.ServerId == serverId).ToArrayAsync();

                    foreach (var ds in query)
                    {
                        serverdToDiscord.Remove(ds.ServerId);
                        discordToServer.Remove(ds.DiscordChannelId);
                        context.DiscordServers.Remove(ds);

                        if (messageQueues.TryGetValue(ds.DiscordChannelId, out var messageQueue))
                        {
                            messageQueues.Remove(ds.DiscordChannelId);
                            messageQueue.Dispose();
                        }

                        if (channelUpdaters.TryGetValue(ds.DiscordChannelId, out var channelUpdater))
                        {
                            channelUpdaters.Remove(ds.DiscordChannelId);
                            channelUpdater.Dispose();
                        }
                    }

                    serverdToDiscord.Add(serverId, channelId);
                    discordToServer.Add(channelId, serverId);

                    context.DiscordServers.Add(new DiscordServers() { DiscordChannelId = channelId, ServerId = serverId });

                    await context.SaveChangesAsync();

                    return Result.OK;
                }
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(SetServerInner));
                return Result.Failure(Constants.UnexpectedErrorKey, "An unexpected error occurred.");
            }
            finally
            {
                discordLock.Release();
            }
        }

        private async ValueTask<IMessageQueue?> GetMessageQueue(string serverId)
        {
            try
            {
                await discordLock.WaitAsync();
                if (!serverdToDiscord.TryGetValue(serverId, out ulong channelId))
                {
                    return null;
                }

                var channel = _client.GetChannel(channelId) as IMessageChannel;
                if (channel == null)
                {
                    return null;
                }

                if (!messageQueues.TryGetValue(channelId, out IMessageQueue? queue))
                {
                    queue = _messageQueueFactory.Create(channel);
                    messageQueues.Add(channelId, queue);
                }

                return queue;
            }
            finally
            {
                discordLock.Release();
            }
        }

        private async ValueTask<IChannelUpdater?> GetChannelUpdater(string serverId)
        {
            try
            {
                await discordLock.WaitAsync();
                if (!serverdToDiscord.TryGetValue(serverId, out ulong channelId))
                {
                    return null;
                }

                var channel = _client.GetChannel(channelId) as ITextChannel;
                if (channel == null)
                {
                    return null;
                }

                if (!channelUpdaters.TryGetValue(channelId, out IChannelUpdater? updater))
                {
                    updater = _channelUpdaterFactory.Create(channel, serverId);
                    channelUpdaters.Add(channelId, updater);
                }

                return updater;
            }
            finally
            {
                discordLock.Release();
            }
        }

        private async void MessageReceived(IDiscordMessageHandlingService sender, MessageReceivedEventArgs eventArgs)
        {
            string serverId;
            try
            {
                await discordLock.WaitAsync();

                if (!discordToServer.TryGetValue(eventArgs.Channel.Id, out string? id))
                {
                    return;
                }

                serverId = id;
            }
            finally
            {
                discordLock.Release();
            }

            FactorioDiscordDataReceived?.Invoke(this, new ServerMessageEventArgs(serverId, eventArgs.User, eventArgs.Message));
        }
    }
}
