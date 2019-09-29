namespace FactorioWebInterface.Models
{
    public class FactorioAdminListChangedEventArgs
    {
        public string ServerId { get; }
        public KeyValueCollectionChangedData<string, object> ChangedData { get; }

        public FactorioAdminListChangedEventArgs(string serverId, KeyValueCollectionChangedData<string, object> changedData)
        {
            ServerId = serverId;
            ChangedData = changedData;
        }
    }
}
