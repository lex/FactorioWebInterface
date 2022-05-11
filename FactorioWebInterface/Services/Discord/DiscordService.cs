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
        Task<bool> IsAdminRoleAsync(string? userId);
        Task<Result> SetServer(string serverId, ulong channelId);
        Task<Result> SetAdminChannel(ulong channelId);
        Task<Result<string?>> UnSetServer(ulong channelId);
        Task<Result> SetNamedChannel(string name, ulong channelId);
        Task<Result> UnSetNamedChannel(string name);
        Task<Result<(string name, ulong channel)[]>> GetNamedChannels();
        Task SendToConnectedChannel(string serverId, string? text = null, Embed? embed = null);
        Task SendToAdminChannel(string? text = null, Embed? embed = null);
        Task SendToNamedChannel(string name, string? text = null, Embed? embed = null);
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
        private readonly Dictionary<string, ulong> nameToDiscord = new Dictionary<string, ulong>(StringComparer.OrdinalIgnoreCase);

        private readonly RefStore<ulong, IMessageQueue> messageQueues = new RefStore<ulong, IMessageQueue>();
        private readonly RefStore<ulong, IChannelUpdater> channelUpdaters = new RefStore<ulong, IChannelUpdater>();

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
            try
            {
                await discordLock.WaitAsync();

                using (var context = _dbContextFactory.Create<ApplicationDbContext>())
                {
                    var servers = context.DiscordServers.AsQueryable().ToArrayAsync();

                    foreach (var ds in await servers)
                    {
                        discordToServer[ds.DiscordChannelId] = ds.ServerId;
                        serverdToDiscord[ds.ServerId] = ds.DiscordChannelId;
                        messageQueues.AddUsage(ds.DiscordChannelId);
                        channelUpdaters.AddUsage(ds.DiscordChannelId);
                    }

                    var namedServers = context.NamedDiscordChannels.AsQueryable().ToArrayAsync();
                    foreach (var ds in await namedServers)
                    {
                        nameToDiscord[ds.Name] = ds.DiscordChannelId;
                        messageQueues.AddUsage(ds.DiscordChannelId);
                    }
                }
            }
            finally
            {
                discordLock.Release();
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
        public Task<bool> IsAdminRoleAsync(string? userId)
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

        public async Task<Result> SetNamedChannel(string name, ulong channelId)
        {
            if (string.IsNullOrWhiteSpace(name) || name.Contains(' '))
            {
                return Result.Failure(Constants.InvalidNameErrorKey, "Channel name can not be empty or whitespace or contain space ' ' characters.");
            }

            try
            {
                await discordLock.WaitAsync();

                using (var context = _dbContextFactory.Create<ApplicationDbContext>())
                {
                    NamedDiscordChannel[] query = await context.NamedDiscordChannels.AsQueryable().Where(x => x.Name == name).ToArrayAsync();

                    if (query.Length == 1 && query[0].DiscordChannelId == channelId)
                    {
                        return Result.OK;
                    }

                    foreach (var ds in query)
                    {
                        nameToDiscord.Remove(name);
                        context.NamedDiscordChannels.Remove(ds);

                        messageQueues.RemoveUsage(ds.DiscordChannelId);
                    }

                    nameToDiscord.Add(name, channelId);
                    messageQueues.AddUsage(channelId);

                    context.NamedDiscordChannels.Add(new NamedDiscordChannel() { DiscordChannelId = channelId, Name = name });

                    await context.SaveChangesAsync();

                    return Result.OK;
                }
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(SetNamedChannel));
                return Result.Failure(Constants.UnexpectedErrorKey, "An unexpected error occurred.");
            }
            finally
            {
                discordLock.Release();
            }
        }

        public async Task<Result> UnSetNamedChannel(string name)
        {
            try
            {
                await discordLock.WaitAsync();

                using (var context = _dbContextFactory.Create<ApplicationDbContext>())
                {
                    NamedDiscordChannel[] query = await context.NamedDiscordChannels.AsQueryable().Where(x => x.Name == name).ToArrayAsync();

                    if (query.Length == 0)
                    {
                        return Result.Failure(Constants.MissingNameErrorKey, $"The name {name} was not found.");
                    }

                    foreach (var ds in query)
                    {
                        nameToDiscord.Remove(name);
                        context.NamedDiscordChannels.Remove(ds);

                        messageQueues.RemoveUsage(ds.DiscordChannelId);
                    }

                    await context.SaveChangesAsync();

                    return Result.OK;
                }
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(UnSetNamedChannel));
                return Result.Failure(Constants.UnexpectedErrorKey, "An unexpected error occurred.");
            }
            finally
            {
                discordLock.Release();
            }
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

                        messageQueues.RemoveUsage(ds.DiscordChannelId);
                        channelUpdaters.RemoveUsage(ds.DiscordChannelId);

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
            if (await GetMessageQueueForServerId(serverId) is IMessageQueue messageQueue)
            {
                EnqueueMessage(messageQueue, text, embed);
            }
        }

        public Task SendToAdminChannel(string? text = null, Embed? embed = null)
        {
            return SendToConnectedChannel(Constants.AdminChannelID, text, embed);
        }

        public async Task SendToNamedChannel(string name, string? text = null, Embed? embed = null)
        {
            if (await GetMessageQueueForNamedChannel(name) is IMessageQueue messageQueue)
            {
                EnqueueMessage(messageQueue, text, embed);
            }
        }

        public async Task<Result<(string name, ulong channel)[]>> GetNamedChannels()
        {
            try
            {
                await discordLock.WaitAsync();

                var array = nameToDiscord.Select(x => (x.Key, x.Value)).ToArray();
                return Result<(string name, ulong channel)[]>.OK(array);
            }
            catch (Exception e)
            {
                _logger.LogError(e, nameof(GetNamedChannels));
                return Result<(string name, ulong channel)[]>.Failure(Constants.UnexpectedErrorKey, "An unexpected error occurred.");
            }
            finally
            {
                discordLock.Release();
            }
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
                        messageQueues.RemoveUsage(ds.DiscordChannelId);
                        channelUpdaters.RemoveUsage(ds.DiscordChannelId);

                        context.DiscordServers.Remove(ds);
                    }

                    serverdToDiscord.Add(serverId, channelId);
                    discordToServer.Add(channelId, serverId);
                    messageQueues.AddUsage(channelId);
                    channelUpdaters.AddUsage(channelId);

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

        private async ValueTask<IMessageQueue?> GetMessageQueueForServerId(string serverId)
        {
            if (serverId is null)
            {
                return null;
            }

            try
            {
                await discordLock.WaitAsync();
                if (!serverdToDiscord.TryGetValue(serverId, out ulong channelId))
                {
                    return null;
                }

                return GetMessageQueueForChannelIdNonLocking(channelId);
            }
            finally
            {
                discordLock.Release();
            }
        }

        private async ValueTask<IMessageQueue?> GetMessageQueueForNamedChannel(string channelName)
        {
            if (channelName is null)
            {
                return null;
            }

            try
            {
                await discordLock.WaitAsync();
                if (!nameToDiscord.TryGetValue(channelName, out ulong channelId))
                {
                    return null;
                }

                return GetMessageQueueForChannelIdNonLocking(channelId);
            }
            finally
            {
                discordLock.Release();
            }
        }

        private IMessageQueue? GetMessageQueueForChannelIdNonLocking(ulong channelId)
        {
            var channel = _client.GetChannel(channelId) as IMessageChannel;
            if (channel == null)
            {
                return null;
            }

            static IMessageQueue Factory((IMessageQueueFactory factory, IMessageChannel mc) state) => state.factory.Create(state.mc);
            return messageQueues.GetValueOrCreate(channelId, Factory, (_messageQueueFactory, channel));
        }

        private static void EnqueueMessage(IMessageQueue messageQueue, string? text = null, Embed? embed = null)
        {
            if (text?.Length > Constants.discordMaxMessageLength)
            {
                text = text.Substring(0, Constants.discordMaxMessageLength);
            }

            if (string.IsNullOrWhiteSpace(text))
            {
                text = null;
            }

            messageQueue.Enqueue(text, embed);
        }

        private async ValueTask<IChannelUpdater?> GetChannelUpdater(string serverId)
        {
            if(serverId is null)
            {
                return null;
            }

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

                static IChannelUpdater Factory((IChannelUpdaterFactory factory, ITextChannel tc, string id) state) => state.factory.Create(state.tc, state.id);
                return channelUpdaters.GetValueOrCreate(channelId, Factory, (_channelUpdaterFactory, channel, serverId));
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
