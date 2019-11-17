using Discord.Commands;
using Discord.WebSocket;
using Microsoft.Extensions.DependencyInjection;

namespace FactorioWebInterface.Services.Discord
{
    public static class DiscordServiceCollectionExtensions
    {
        public static IServiceCollection AddDiscord(this IServiceCollection services)
        {
            return services.AddSingleton<DiscordSocketClient>()
                .AddSingleton<CommandService>()
                .AddSingleton<IDiscordMessageHandlingService, DiscordMessageHandlingService>()
                .AddSingleton(typeof(IDiscordBotHelpService<>), typeof(DiscordBotHelpService<>))
                .AddSingleton<IDiscordService, DiscordService>()
                .AddSingleton<DiscordBot>();
        }
    }
}
