using FactorioWebInterface.Data;

namespace FactorioWebInterface.Models
{
    public class FactorioBanEventArgs
    {
        public bool SynchronizeWithServers { get; }
        public string Source { get; }
        public CollectionChangedData<Ban> ChangeData { get; }

        public FactorioBanEventArgs(bool synchronizeWithServers, string source, CollectionChangedData<Ban> changeData)
        {
            SynchronizeWithServers = synchronizeWithServers;
            Source = source;
            ChangeData = changeData;
        }
    }
}
