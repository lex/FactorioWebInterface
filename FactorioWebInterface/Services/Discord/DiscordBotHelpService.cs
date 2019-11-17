using Discord;
using Discord.Commands;
using FactorioWebInterface.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FactorioWebInterface.Services.Discord
{
    public interface IDiscordBotHelpService<T> where T : ModuleBase<SocketCommandContext>
    {
        public Embed GetEmbed(string? command);
    }

    public class DiscordBotHelpService<T> : IDiscordBotHelpService<T> where T : ModuleBase<SocketCommandContext>
    {
        private Dictionary<string, Embed> HelpLookup = DiscordBotCommandHelpBuilder.BuildHelp<DiscordBotCommands>();

        public DiscordBotHelpService()
        {
        }

        public Embed GetEmbed(string? command)
        {
            command = command ?? "help";
            command = command.Trim();
            if (command.StartsWith(Constants.DiscordBotCommandPrefix))
            {
                command = command.Substring(Constants.DiscordBotCommandPrefix.Length);
            }

            if (!HelpLookup.TryGetValue(command, out Embed? embed))
            {
                embed = HelpLookup["help"];
            }

            return embed;
        }
    }
}
