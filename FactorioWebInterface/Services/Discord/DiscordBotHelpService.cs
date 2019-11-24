using Discord;
using Discord.Commands;
using Discord.WebSocket;
using FactorioWebInterface.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FactorioWebInterface.Services.Discord
{
    public interface IDiscordBotHelpService<T> where T : ModuleBase<SocketCommandContext>
    {
        Task DoHelp(ISocketMessageChannel channel, string? command);
    }

    public class DiscordBotHelpService<T> : IDiscordBotHelpService<T> where T : ModuleBase<SocketCommandContext>
    {
        private Dictionary<string, Embed> commandLookup;
        private Embed commandListings;

        public DiscordBotHelpService()
        {
            (commandLookup, commandListings) = DiscordBotCommandHelpBuilder.BuildHelp<T>();
        }

        public async Task DoHelp(ISocketMessageChannel channel, string? command)
        {
            if (string.IsNullOrWhiteSpace(command))
            {
                await channel.SendMessageAsync(embed: commandListings);
                return;
            }

            command = command.Trim();
            if (command.StartsWith(Constants.DiscordBotCommandPrefix))
            {
                command = command.Substring(Constants.DiscordBotCommandPrefix.Length);
            }

            if (string.IsNullOrWhiteSpace(command))
            {
                await channel.SendMessageAsync(embed: commandListings);
                return;
            }

            if (commandLookup.TryGetValue(command, out Embed? embed))
            {
                await channel.SendMessageAsync(embed: embed);
                return;
            }

            var errorEmbed = new EmbedBuilder()
            {
                Description = $"Sorry, command `{command}` not found, see command listings below.",
                Color = DiscordColors.failureColor
            }.Build();
            await channel.SendMessageAsync(embed: errorEmbed);

            await channel.SendMessageAsync(embed: commandListings);
        }
    }
}
