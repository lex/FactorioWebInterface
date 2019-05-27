using DSharpPlus.CommandsNext;
using DSharpPlus.Entities;
using FactorioWebInterface.Models;

namespace FactorioWebInterface.Services
{
    public class DiscordBot
    {
        public static readonly DiscordColor infoColor = new DiscordColor(0, 127, 255);
        public static readonly DiscordColor successColor = DiscordColor.Green;
        public static readonly DiscordColor failureColor = DiscordColor.Red;
        public static readonly DiscordColor updateColor = DiscordColor.Yellow;

        public DiscordBot(DiscordBotContext discordBotContext, IFactorioServerManager factorioServerManager)
        {
            var d = new DependencyCollectionBuilder()
                .AddInstance(discordBotContext)
                .AddInstance(factorioServerManager)
                .Build();

            var commands = discordBotContext.DiscordClient.UseCommandsNext(new CommandsNextConfiguration
            {
                StringPrefix = ";;",
                Dependencies = d,
                CaseSensitive = false
            });

            commands.RegisterCommands<DiscordBotCommands>();
        }
    }
}
