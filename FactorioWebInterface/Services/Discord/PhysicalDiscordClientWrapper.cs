using Discord;
using Discord.WebSocket;

namespace FactorioWebInterface.Services.Discord
{
    public interface IDiscordClientWrapper
    {
        IGuild? GetGuild(ulong id);
        ITextChannel? GetChannel(ulong id);
    }

    public class PhysicalDiscordClientWrapper : IDiscordClientWrapper
    {
        private readonly DiscordSocketClient _client;

        public PhysicalDiscordClientWrapper(DiscordSocketClient client)
        {
            _client = client;
        }

        public ITextChannel? GetChannel(ulong id) => _client.GetChannel(id) as ITextChannel;

        public IGuild? GetGuild(ulong id) => _client.GetGuild(id);
    }
}
