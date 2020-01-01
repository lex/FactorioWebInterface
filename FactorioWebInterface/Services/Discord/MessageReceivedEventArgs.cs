using Discord;
using Discord.WebSocket;

namespace FactorioWebInterface.Services.Discord
{
    public class MessageReceivedEventArgs
    {
        public ISocketMessageChannel Channel { get; }
        public IUser User { get; }
        public string Message { get; }

        public MessageReceivedEventArgs(ISocketMessageChannel channel, IUser user, string message)
        {
            Channel = channel;
            User = user;
            Message = message;
        }
    }
}
