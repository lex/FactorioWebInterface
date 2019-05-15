using System;
using System.Collections.Generic;

namespace FactorioWebInterface.Models
{
    public enum FilesChangedType
    {
        Create,
        Delete,
        Rename
    }

    public class FilesChangedEventArgs
    {
        public string ServerId { get; }
        public FilesChangedType Type { get; }
        public IList<FileMetaData> NewOrUpdated { get; }
        public IList<FileMetaData> Old { get; }

        public FilesChangedEventArgs(string serverId, FilesChangedType type, IList<FileMetaData> newOrUpdated, IList<FileMetaData> old = null)
        {
            ServerId = serverId;
            Type = type;
            NewOrUpdated = newOrUpdated;
            Old = old ?? Array.Empty<FileMetaData>();
        }
    }
}
