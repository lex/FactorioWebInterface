using Discord;

namespace FactorioWebInterface.Models
{
    public class ServerMessageEventArgs
    {
        public ServerMessageEventArgs(string serverId, IUser user, string message)
        {
            ServerId = serverId;
            User = user;
            Message = message;
        }

        public string ServerId { get; }
        public IUser User { get; }
        public string Message { get; }
    }
}