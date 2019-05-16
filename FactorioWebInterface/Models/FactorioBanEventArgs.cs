using FactorioWebInterface.Data;

namespace FactorioWebInterface.Models
{
    public class FactorioBanAddedEventArgs
    {
        public Ban Ban { get; }
        public bool SynchronizeWithServers { get; }
        public string Source { get; }

        public FactorioBanAddedEventArgs(Ban ban, bool synchronizeWithServers, string source)
        {
            Ban = ban;
            SynchronizeWithServers = synchronizeWithServers;
            Source = source;
        }
    }

    public class FactorioBanRemovedEventArgs
    {
        public string Username { get; }
        public bool SynchronizeWithServers { get; }
        public string Source { get; }

        public FactorioBanRemovedEventArgs(string username, bool synchronizeWithServers, string source)
        {
            Username = username;
            SynchronizeWithServers = synchronizeWithServers;
            Source = source;
        }
    }
}
