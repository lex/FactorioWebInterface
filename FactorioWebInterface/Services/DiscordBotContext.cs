using DSharpPlus;
using DSharpPlus.Entities;
using FactorioWebInterface.Data;
using FactorioWebInterface.Models;
using FactorioWebInterface.Utils;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Shared.Utils;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace FactorioWebInterface.Services
{
    public class DiscordBotContext
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
            public DiscordChannel? Channel { get; set; }
            public string? Content { get; set; }
            public DiscordEmbed? Embed { get; set; }
        }

        private const int maxMessageQueueSize = 1000;

        private readonly IConfiguration _configuration;
        private readonly IDbContextFactory _dbContextFactory;
        private readonly ILogger<DiscordBot> _logger;

        private readonly ulong guildId;
        private readonly HashSet<ulong> validAdminRoleIds = new HashSet<ulong>();

        private readonly SemaphoreSlim discordLock = new SemaphoreSlim(1, 1);
        private readonly Dictionary<ulong, string> discordToServer = new Dictionary<ulong, string>();
        private readonly Dictionary<string, ulong> serverdToDiscord = new Dictionary<string, ulong>();

        private SingleConsumerQueue<Message> messageQueue = default!;

        public DiscordClient DiscordClient { get; private set; } = default!;

        public event EventHandler<DiscordBotContext, ServerMessageEventArgs>? FactorioDiscordDataReceived;

        public DiscordBotContext(IConfiguration configuration, IDbContextFactory dbContextFactory, ILogger<DiscordBot> logger)
        {
            _configuration = configuration;
            _dbContextFactory = dbContextFactory;
            _logger = logger;

            guildId = ulong.Parse(_configuration[Constants.GuildIDKey]);

            BuildValidAdminRoleIds(configuration);

            InitAsync().GetAwaiter().GetResult();
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

        private async Task InitAsync()
        {
            DiscordClient = new DiscordClient(new DiscordConfiguration
            {
                Token = _configuration[Constants.DiscordBotTokenKey],
                TokenType = TokenType.Bot
            });

            DiscordClient.MessageCreated += DiscordClient_MessageCreated;

            var discordTask = DiscordClient.ConnectAsync();

            using (var context = _dbContextFactory.Create<ApplicationDbContext>())
            {
                foreach (var ds in context.DiscordServers)
                {
                    discordToServer[ds.DiscordChannelId] = ds.ServerId;
                    serverdToDiscord[ds.ServerId] = ds.DiscordChannelId;
                }
            }

            messageQueue = new SingleConsumerQueue<Message>(maxMessageQueueSize, async m =>
            {
                try
                {
                    await DiscordClient.SendMessageAsync(m.Channel, m.Content, false, m.Embed);
                }
                catch (Exception e)
                {
                    _logger.LogError(e, "messageQueue consumer");
                }
            });

            await discordTask;
        }

        private async Task DiscordClient_MessageCreated(DSharpPlus.EventArgs.MessageCreateEventArgs e)
        {
            if (e.Author.IsCurrent)
            {
                return;
            }

            string serverId;
            try
            {
                await discordLock.WaitAsync();

                if (!discordToServer.TryGetValue(e.Channel.Id, out string? id))
                {
                    return;
                }

                serverId = id;
            }
            finally
            {
                discordLock.Release();
            }

            FactorioDiscordDataReceived?.Invoke(this, new ServerMessageEventArgs(serverId, e.Author, e.Message.Content));
        }

        /// <summary>
        /// Returns a boolean for if the discord user has the admin-like role in the Redmew guild.
        /// </summary>
        /// <param name="userId">The discord user's id.</param>        
        public async Task<bool> IsAdminRoleAsync(ulong userId)
        {
            var guild = await DiscordClient.GetGuildAsync(guildId);
            DiscordMember member;

            try
            {
                // Apprently this throws an excpetion if the member isn't found.
                member = await guild.GetMemberAsync(userId);
            }
            catch (Exception)
            {
                return false;
            }

            if (member == null)
                return false;

            var role = member.Roles.FirstOrDefault(x => validAdminRoleIds.Contains(x.Id));

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
            try
            {
                await discordLock.WaitAsync();

                using (var context = _dbContextFactory.Create<ApplicationDbContext>())
                {
                    var query = context.DiscordServers.Where(x => x.DiscordChannelId == channelId || x.ServerId == serverId);

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
                    var query = context.DiscordServers.Where(x => x.DiscordChannelId == channelId);

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

            var channel = await DiscordClient.GetChannelAsync(channelId);
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

        public async Task SendEmbedToFactorioChannel(string serverId, DiscordEmbed embed)
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

            var channel = await DiscordClient.GetChannelAsync(channelId);
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

        public Task SendEmbedToFactorioAdminChannel(DiscordEmbed embed)
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

            var channel = await DiscordClient.GetChannelAsync(channelId);
            if (channel == null)
            {
                return;
            }

            await channel.ModifyAsync(name: name, topic: topic);
        }
    }
}
