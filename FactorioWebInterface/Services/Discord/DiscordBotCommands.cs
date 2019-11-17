using Discord;
using Discord.Commands;
using FactorioWebInterface.Models;
using System.Threading.Tasks;

namespace FactorioWebInterface.Services.Discord
{
    public class DiscordBotCommands : ModuleBase<SocketCommandContext>
    {
        private readonly IDiscordBotHelpService<DiscordBotCommands> _helpService;
        private readonly IDiscordService _discordService;

        public DiscordBotCommands(IDiscordService discordService, IDiscordBotHelpService<DiscordBotCommands> helpService)
        {
            _helpService = helpService;
            _discordService = discordService;
        }

        [Command("ping")]
        [Summary("Pings the bot.")]
        [Example("")]
        public Task Ping()
        {
            var embed = new EmbedBuilder()
            {
                Title = $"pong in {Context.Client.Latency}ms",
                Color = DiscordColors.infoColor
            }
            .Build();

            return ReplyAsync(embed: embed);
        }

        [Command("setserver")]
        [Summary("Connects a Factorio server to this channel.")]
        [Remarks("Links the Discord channel to the Factorio server with the ID.")]
        [Example("7")]
        [RequireUserPermission(GuildPermission.ManageChannels)]
        public async Task SetServer([Summary("The ServerID as shown on the [/servers](https://redmew.com/admin/servers/) page on the web panel.")] string serverId)
        {
            EmbedBuilder embed;
            if (await _discordService.SetServer(serverId, Context.Channel.Id))
            {
                embed = new EmbedBuilder()
                {
                    Description = $"Factorio server {serverId} has been connected to this channel",
                    Color = DiscordColors.successColor
                };
            }
            else
            {
                embed = new EmbedBuilder()
                {
                    Description = $"Error connecting the factorio server {serverId} to this channel",
                    Color = DiscordColors.failureColor
                };
            }

            await ReplyAsync(embed: embed.Build());
        }

        [Command("unset")]
        [Summary("Disconnects the currently connected Factorio server from this channel.")]
        [Remarks("If this Discord channel is linked to a Facotrio server, removes the connection.")]
        [Example("")]
        [RequireUserPermission(GuildPermission.ManageChannels)]
        public async Task UnSetServer()
        {
            EmbedBuilder embed;
            string? serverId = await _discordService.UnSetServer(Context.Channel.Id);
            if (serverId != null)
            {
                string description = serverId == Constants.AdminChannelID
                    ? "Admin has been disconnected from this channel"
                    : $"Factorio server {serverId} has been disconnected from this channel";

                embed = new EmbedBuilder()
                {
                    Description = description,
                    Color = DiscordColors.successColor
                };
            }
            else
            {
                embed = new EmbedBuilder()
                {
                    Description = $"Error disconnecting the factorio server from this channel",
                    Color = DiscordColors.failureColor
                };
            }

            await ReplyAsync(embed: embed.Build());
        }

        [Command("setadmin")]
        [Summary("Sets this Discord channel as the Admin channel.")]
        [Remarks("Remove with the unset command.")]
        [Example("")]
        [RequireUserPermission(GuildPermission.ManageChannels)]
        public async Task SetAdmin()
        {
            EmbedBuilder embed;
            bool success = await _discordService.SetServer(Constants.AdminChannelID, Context.Channel.Id);
            if (success)
            {
                embed = new EmbedBuilder()
                {
                    Description = $"Admin has been connected to this channel",
                    Color = DiscordColors.successColor
                };
            }
            else
            {
                embed = new EmbedBuilder()
                {
                    Description = $"Error connecting Admin to this channel",
                    Color = DiscordColors.failureColor
                };
            }

            await ReplyAsync(embed: embed.Build());
        }

        [Command("help")]
        [Summary("Shows Commands for this bot, use `" + Constants.DiscordBotCommandPrefix + "help <command_name>` for more details.")]
        public Task Help([Remainder] string? command = null)
        {
            var embed = _helpService.GetEmbed(command);
            return ReplyAsync(embed: embed);
        }
    }
}
