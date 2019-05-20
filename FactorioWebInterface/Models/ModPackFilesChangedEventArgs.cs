using System.Collections.Generic;

namespace FactorioWebInterface.Models
{
    public class ModPackFilesChangedEventArgs
    {
        public string ModPack { get; }
        public CollectionChangedData<ModPackFileMetaData> ChangedData { get; set; }

        public ModPackFilesChangedEventArgs(string modPack, CollectionChangedData<ModPackFileMetaData> changedData)
        {
            ModPack = modPack;
            ChangedData = changedData;
        }
    }
}
