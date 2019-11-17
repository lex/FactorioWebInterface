using Discord;
using Discord.WebSocket;
using FactorioWebInterface.Data;
using FactorioWebInterface.Models;
using FactorioWebInterface.Utils;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Shared.Utils;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace FactorioWebInterface.Services.Discord
{
    public interface IDiscordService
    {
        Task<bool> IsAdminRoleAsync(ulong userId);
        Task<bool> IsAdminRoleAsync(string userId);
        Task<bool> SetServer(string serverId, ulong channelId);
        Task<string?> UnSetServer(ulong channelId);
        Task SendToFactorioChannel(string serverId, string data);
        Task SendEmbedToFactorioChannel(string serverId, Embed embed);
        Task SendToFactorioAdminChannel(string data);
        Task SendEmbedToFactorioAdminChannel(Embed embed);
        Task SetChannelNameAndTopic(string serverId, string? name = null, string? topic = null);

        Task Init();

        event EventHandler<IDiscordService, ServerMessageEventArgs>? FactorioDiscordDataReceived;
    }

    public class DiscordService : IDiscordService
    {
        public class Role
        {
            public string? Name { get; set; }
            public ulong Id { get; set; }
        }

        public class AdminRoles
        {
            public Role[] Roles { get; set; } = Array.Empty<Role>();
        }

        private class Message
        {
            public ISocketMessageChannel? Channel { get; set; }
            public string? Content { get; set; }
            public Embed? Embed { get; set; }
        }

        private const int maxMessageQueueSize = 1000;

        private readonly IConfiguration _configuration;
        private readonly DiscordSocketClient _client;
        private readonly IDiscordMessageHandlingService _messageService;
        private readonly IDbContextFactory _dbContextFactory;
        private readonly IFactorioServerDataService _factorioServerDataService;
        private readonly ILogger<DiscordService> _logger;

        private readonly ulong guildId;
        private readonly HashSet<ulong> validAdminRoleIds = new HashSet<ulong>();

        private readonly SemaphoreSlim discordLock = new SemaphoreSlim(1, 1);
        private readonly Dictionary<ulong, string> discordToServer = new Dictionary<ulong, string>();
        private readonly Dictionary<string, ulong> serverdToDiscord = new Dictionary<string, ulong>();

        private SingleConsumerQueue<Message> messageQueue = default!;

        public event EventHandler<IDiscordService, ServerMessageEventArgs>? FactorioDiscordDataReceived;

        public DiscordService(IConfiguration configuration,
            DiscordSocketClient client,
            IDiscordMessageHandlingService messageService,
            IDbContextFactory dbContextFactory,
            IFactorioServerDataService factorioServerDataService,
            ILogger<DiscordService> logger)
        {
            _configuration = configuration;
            _client = client;
            _messageService = messageService;
            _dbContextFactory = dbContextFactory;
            _factorioServerDataService = factorioServerDataService;
            _logger = logger;

            guildId = ulong.Parse(_configuration[Constants.GuildIDKey]);

            _messageService.MessageReceived += MessageReceived;

            BuildValidAdminRoleIds(configuration);
        }

        public async Task Init()
        {
            using (var context = _dbContextFactory.Create<ApplicationDbContext>())
            {
                var servers = context.DiscordServers.ToArrayAsync();

                messageQueue = new SingleConsumerQueue<Message>(maxMessageQueueSize, async m =>
                {
                    try
                    {
                        if (m.Channel != null)
                        {
                            await m.Channel.SendMessageAsync(text: m.Content, embed: m.Embed);
                        }
                    }
                    catch (Exception e)
                    {
                        _logger.LogError(e, "messageQueue consumer");
                    }
                });

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

            var user = await GetUserAsync(guild, userId);
            if (user == null)
            {
                return false;
            }

            var role = user.Roles.FirstOrDefault(x => validAdminRoleIds.Contains(x.Id));
            return role != null;
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

        public async Task<bool> SetServer(string serverId, ulong channelId)
        {
            if (!_factorioServerDataService.IsValidServerId(serverId))
            {
                return false;
            }

            try
            {
                await discordLock.WaitAsync();

                using (var context = _dbContextFactory.Create<ApplicationDbContext>())
                {
                    var query = await context.DiscordServers.Where(x => x.DiscordChannelId == channelId || x.ServerId == serverId).ToArrayAsync();

                    foreach (var ds in query)
                    {
                        serverdToDiscord.Remove(ds.ServerId);
                        discordToServer.Remove(ds.DiscordChannelId);
                        context.DiscordServers.Remove(ds);
                    }

                    serverdToDiscord.Add(serverId, channelId);
                    discordToServer.Add(channelId, serverId);

                    context.Add(new DiscordServers() { DiscordChannelId = channelId, ServerId = serverId });

                    await context.SaveChangesAsync();

                    return true;
                }
            }
            catch (Exception)
            {
                return false;
            }
            finally
            {
                discordLock.Release();
            }
        }

        public async Task<string?> UnSetServer(ulong channelId)
        {
            try
            {
                await discordLock.WaitAsync();

                using (var context = _dbContextFactory.Create<ApplicationDbContext>())
                {
                    var query = await context.DiscordServers.Where(x => x.DiscordChannelId == channelId).ToArrayAsync();

                    string? serverId = null;

                    foreach (var ds in query)
                    {
                        serverdToDiscord.Remove(ds.ServerId);
                        discordToServer.Remove(ds.DiscordChannelId);
                        context.DiscordServers.Remove(ds);

                        serverId = ds.ServerId;
                    }

                    await context.SaveChangesAsync();

                    return serverId;
                }
            }
            catch (Exception)
            {
                return null;
            }
            finally
            {
                discordLock.Release();
            }
        }

        public async Task SendToFactorioChannel(string serverId, string data)
        {
            ulong channelId;
            try
            {
                await discordLock.WaitAsync();
                if (!serverdToDiscord.TryGetValue(serverId, out channelId))
                {
                    return;
                }
            }
            finally
            {
                discordLock.Release();
            }

            var channel = _client.GetChannel(channelId) as ISocketMessageChannel;
            if (channel == null)
            {
                return;
            }

            if (data.Length > Constants.discordMaxMessageLength)
            {
                data = data.Substring(0, Constants.discordMaxMessageLength);
            }

            var message = new Message()
            {
                Channel = channel,
                Content = data
            };
            messageQueue.Enqueue(message);
        }

        public async Task SendEmbedToFactorioChannel(string serverId, Embed embed)
        {
            ulong channelId;
            try
            {
                await discordLock.WaitAsync();
                if (!serverdToDiscord.TryGetValue(serverId, out channelId))
                {
                    return;
                }
            }
            finally
            {
                discordLock.Release();
            }

            var channel = _client.GetChannel(channelId) as ISocketMessageChannel;
            if (channel == null)
            {
                return;
            }

            var message = new Message()
            {
                Channel = channel,
                Embed = embed
            };
            messageQueue.Enqueue(message);
        }

        public Task SendToFactorioAdminChannel(string data)
        {
            return SendToFactorioChannel(Constants.AdminChannelID, data);
        }

        public Task SendEmbedToFactorioAdminChannel(Embed embed)
        {
            return SendEmbedToFactorioChannel(Constants.AdminChannelID, embed);
        }

        public async Task SetChannelNameAndTopic(string serverId, string? name = null, string? topic = null)
        {
            ulong channelId;
            try
            {
                await discordLock.WaitAsync();
                if (!serverdToDiscord.TryGetValue(serverId, out channelId))
                {
                    return;
                }
            }
            finally
            {
                discordLock.Release();
            }

            var channel = _client.GetChannel(channelId) as ITextChannel;
            if (channel == null)
            {
                return;
            }

            void Modify(TextChannelProperties props)
            {
                if (name != null)
                {
                    props.Name = name;
                }

                if (topic != null)
                {
                    props.Topic = topic;
                }
            }

            await channel.ModifyAsync(Modify);
        }

        private async ValueTask<SocketGuildUser> GetUserAsync(SocketGuild guild, ulong id)
        {
            var user = guild.GetUser(id);
            if (user != null)
            {
                return user;
            }

            await guild.DownloadUsersAsync();
            return guild.GetUser(id);
        }

        private async void MessageReceived(IDiscordMessageHandlingService sender, SocketMessage eventArgs)
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

            FactorioDiscordDataReceived?.Invoke(this, new ServerMessageEventArgs(serverId, eventArgs.Author, eventArgs.Content));
        }

        private void BuildValidAdminRoleIds(IConfiguration configuration)
        {
            var ar = new AdminRoles();
            configuration.GetSection(Constants.AdminRolesKey).Bind(ar);

            foreach (var item in ar.Roles)
            {
                validAdminRoleIds.Add(item.Id);
            }
        }
    }
}
