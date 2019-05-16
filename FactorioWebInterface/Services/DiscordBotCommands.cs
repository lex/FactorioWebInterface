using DSharpPlus.CommandsNext;
using DSharpPlus.CommandsNext.Attributes;
using DSharpPlus.Entities;
using System.Threading.Tasks;

namespace FactorioWebInterface.Services
{
    public class DiscordBotCommands
    {
        private readonly DiscordBotContext _discordBotContext;
        private readonly IFactorioServerManager _factorioServerManager;

        public DiscordBotCommands(DiscordBotContext discordBot, IFactorioServerManager factorioServerManager)
        {
            _discordBotContext = discordBot;
            _factorioServerManager = factorioServerManager;

            var c = _discordBotContext.DiscordClient.GetCommandsNext();
            c.CommandErrored += CommandErrored;
        }

        private async Task CommandErrored(CommandErrorEventArgs e)
        {
            string commandName = e.Command?.Name;
            if (commandName == null)
            {
                var embed = new DiscordEmbedBuilder()
                {
                    Description = $"Unknow command name see ;;help for command information.",
                    Color = DiscordBot.failureColor
                }
                .Build();

                await e.Context.RespondAsync(embed: embed);
            }
            else
            {
                var embed = new DiscordEmbedBuilder()
                {
                    Description = $"Invalid use of {commandName} see ;;help {commandName} for help with this command.",
                    Color = DiscordBot.failureColor
                }
                .Build();

                await e.Context.RespondAsync(embed: embed);
            }
        }

        [Command("ping")]
        [Description("Pings the bot.")]
        [Hidden]
        public async Task Ping(CommandContext ctx)
        {
            var embed = new DiscordEmbedBuilder()
            {
                Title = $"pong in {ctx.Client.Ping}ms",
                Color = DiscordBot.infoColor
            }
            .Build();

            await ctx.RespondAsync(embed: embed);
        }

        private async Task ErrorSetSever(CommandContext ctx, string serverId)
        {
            var embed = new DiscordEmbedBuilder()
            {
                Description = $"Error connecting the factorio server {serverId} to this channel",
                Color = DiscordBot.failureColor
            }
            .Build();

            await ctx.RespondAsync(embed: embed);
        }

        [Command("setserver")]
        [RequireUserPermissions(DSharpPlus.Permissions.ManageChannels)]
        [Description("Connects the factorio server to this channel.")]
        public async Task SetServer(CommandContext ctx, [Description("The Factorio server ID eg 7.")] string serverId)
        {
            if (!_factorioServerManager.IsValidServerId(serverId))
            {
                await ErrorSetSever(ctx, serverId);
                return;
            }

            if (!await _discordBotContext.SetServer(serverId, ctx.Channel.Id))
            {
                await ErrorSetSever(ctx, serverId);
                return;
            }

            var embed = new DiscordEmbedBuilder()
            {
                Description = $"Factorio server {serverId} has been connected to this channel",
                Color = DiscordBot.successColor
            }
            .Build();

            await ctx.RespondAsync(embed: embed);
        }

        [Command("unset")]
        [RequireUserPermissions(DSharpPlus.Permissions.ManageChannels)]
        [Description("Disconnects the currently connected factorio server from this channel.")]
        public async Task UnSetServer(CommandContext ctx)
        {
            string serverId = await _discordBotContext.UnSetServer(ctx.Channel.Id);
            if (serverId != null)
            {
                string description = serverId == Constants.AdminChannelID
                    ? $"Admin has been disconnected from this channel"
                    : $"Factorio server {serverId} has been disconnected from this channel";

                var embed = new DiscordEmbedBuilder()
                {
                    Description = description,
                    Color = DiscordBot.successColor
                }
                .Build();

                await ctx.RespondAsync(embed: embed);
            }
            else
            {
                var embed = new DiscordEmbedBuilder()
                {
                    Description = $"Error disconnecting the factorio server from this channel",
                    Color = DiscordBot.failureColor
                }
                .Build();

                await ctx.RespondAsync(embed: embed);
            }
        }

        [Command("setadmin")]
        [RequireUserPermissions(DSharpPlus.Permissions.ManageChannels)]
        [Description("Connects the factorio server to this channel.")]
        public async Task SetAdmin(CommandContext ctx)
        {
            bool success = await _discordBotContext.SetServer(Constants.AdminChannelID, ctx.Channel.Id);
            if (success)
            {
                var embed = new DiscordEmbedBuilder()
                {
                    Description = $"Admin has been connected to this channel",
                    Color = DiscordBot.successColor
                }
                .Build();

                await ctx.RespondAsync(embed: embed);
            }
            else
            {
                var embed = new DiscordEmbedBuilder()
                {
                    Description = $"Error connecting Admin to this channel",
                    Color = DiscordBot.failureColor
                }
                .Build();

                await ctx.RespondAsync(embed: embed);
            }
        }
    }
}
