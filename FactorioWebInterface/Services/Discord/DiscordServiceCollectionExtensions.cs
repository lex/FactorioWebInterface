using Discord.Commands;
using Discord.WebSocket;
using Microsoft.Extensions.DependencyInjection;
using System.Diagnostics;
using static FactorioWebInterface.Services.Discord.DiscordBotCommands;

namespace FactorioWebInterface.Services.Discord
{
    public static class DiscordServiceCollectionExtensions
    {
        public static IServiceCollection AddDiscord(this IServiceCollection services)
        {
            return services
                .AddSingleton<BaseSocketClient, DiscordSocketClient>()
                .AddSingleton(sp => (DiscordSocketClient)sp.GetRequiredService<BaseSocketClient>())
                .AddSingleton<CommandService>()
                .AddSingleton<IDiscordMessageHandlingService, DiscordMessageHandlingService>()
                .AddSingleton<SetServerParameterSummary, SetServerParameterSummary>()
                .AddSingleton(typeof(IDiscordBotHelpService<>), typeof(DiscordBotHelpService<>))
                .AddSingleton<IMessageQueueFactory, MessageQueueFactory>()
                .AddSingleton<IDiscordService, DiscordService>()
                .AddSingleton<DiscordBot>();
        }
    }
}
