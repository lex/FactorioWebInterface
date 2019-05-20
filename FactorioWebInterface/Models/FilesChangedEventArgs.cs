using System;
using System.Collections.Generic;

namespace FactorioWebInterface.Models
{
    public class FilesChangedEventArgs
    {
        public string ServerId { get; }
        public CollectionChangedData<FileMetaData> ChangedData { get; }
        public FilesChangedEventArgs(string serverId, CollectionChangedData<FileMetaData> changedData)
        {
            ServerId = serverId;
            ChangedData = changedData;
        }
    }
}
