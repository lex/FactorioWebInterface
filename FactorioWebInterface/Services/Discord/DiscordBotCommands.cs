using Discord;
using Discord.Commands;
using FactorioWebInterface.Models;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;

namespace FactorioWebInterface.Services.Discord
{
    public class DiscordBotCommands : ModuleBase<SocketCommandContext>
    {
        public const string DefaultSuccessTitle = ":white_check_mark:  Success!";
        public const string DefaultFailureTitle = ":x:  An Error Ocurred!";

        private readonly IDiscordBotHelpService<DiscordBotCommands> _helpService;
        private readonly IDiscordService _discordService;

        public DiscordBotCommands(IDiscordService discordService, IDiscordBotHelpService<DiscordBotCommands> helpService)
        {
            _helpService = helpService;
            _discordService = discordService;
        }

        [Command("ping")]
        [Alias("p")]
        [Summary("Pings the bot.")]
        [Example("")]
        public Task Ping()
        {
            var embed = new EmbedBuilder()
            {
                Title = $"pong in {Context.Client.Latency}ms.",
                Color = DiscordColors.infoColor
            }
            .Build();

            return ReplyAsync(embed: embed);
        }

        public class SetServerParameterSummary : ISummaryCallbackMessage
        {
            public string Message { get; }

            public SetServerParameterSummary(IConfiguration _configuration)
            {
                string? url = _configuration[Constants.ServerURLKey] ?? "";
                if (string.IsNullOrWhiteSpace(url))
                {
                    Message = $"The ServerID as shown on the /admin/servers/ page on the web panel.";
                }
                else
                {
                    Message = $"The ServerID as shown on the [/servers]({url}/admin/servers/) page on the web panel.";
                }
            }
        }

        [Command("setserver")]
        [Alias("s")]
        [Summary("Connects a Factorio server to this channel.")]
        [Remarks("Links the Discord channel to the Factorio server with the ID. There can only be a one to one mapping from server IDs to channel IDs. If there is already a link from this channel to another server, the old link is removed. Links can be removed with the `;;unset` command.")]
        [Example("7")]
        [RequireUserPermission(GuildPermission.ManageChannels)]
        public async Task SetServer([SummaryCallback(typeof(SetServerParameterSummary))] string serverId)
        {
            var result = await _discordService.SetServer(serverId, Context.Channel.Id);
            await ReplyForResult(result, successMessage: $"Factorio serverID {serverId} has been connected to this channel.");
        }

        [Command("unset")]
        [Alias("u")]
        [Summary("Disconnects the currently connected Factorio server from this channel.")]
        [Remarks("If this Discord channel is linked to a Facotrio server, removes the connection.")]
        [Example("")]
        [RequireUserPermission(GuildPermission.ManageChannels)]
        public async Task UnSetServer()
        {
            var result = await _discordService.UnSetServer(Context.Channel.Id);

            string? successDescription = null;
            if (result.Success)
            {
                string serverId = result.Value!;
                successDescription = serverId == Constants.AdminChannelID
                    ? "Admin has been disconnected from this channel."
                    : $"Factorio serverID {serverId} has been disconnected from this channel.";
            }

            await ReplyForResult(result, successDescription);
        }

        [Command("setadmin")]
        [Alias("a")]
        [Summary("Sets this Discord channel as the Admin channel.")]
        [Remarks("Remove with the unset command.")]
        [Example("")]
        [RequireUserPermission(GuildPermission.ManageChannels)]
        public async Task SetAdmin()
        {
            var result = await _discordService.SetAdminChannel(Context.Channel.Id);
            await ReplyForResult(result, successMessage: "Admin has been connected to this channel.");
        }

        [Command("help")]
        [Alias("h", "?")]
        [Summary("Shows Commands for this bot, use `" + Constants.DiscordBotCommandPrefix + "help <command_name>` for more details.")]
        [Example("")]
        [Example("setserver")]
        public Task Help([Remainder][Summary("The command to show more information for.")] string? command = null)
        {
            return _helpService.DoHelp(Context.Channel, command);
        }

        private async ValueTask ReplyForResult(Result result, string? successTitle = DefaultSuccessTitle, string? successMessage = null, string? failureTitle = DefaultFailureTitle)
        {
            EmbedBuilder embed;
            if (result.Success)
            {
                embed = new EmbedBuilder()
                {
                    Title = successTitle,
                    Description = successMessage,
                    Color = DiscordColors.successColor
                };
            }
            else
            {
                embed = new EmbedBuilder()
                {
                    Title = failureTitle,
                    Description = result.ErrorDescriptions,
                    Color = DiscordColors.failureColor
                };
            }

            await ReplyAsync(embed: embed.Build());
        }
    }
}
