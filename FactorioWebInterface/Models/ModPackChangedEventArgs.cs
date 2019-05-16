using System.Collections.Generic;

namespace FactorioWebInterface.Models
{
    public enum ModPackChangedType
    {
        Create,
        Delete,
        Rename
    }

    public class ModPackChangedEventArgs
    {
        public ModPackChangedType Type { get; }
        public ModPackMetaData NewOrUpdated { get; }
        public ModPackMetaData Old { get; }

        public ModPackChangedEventArgs(ModPackChangedType type, ModPackMetaData newOrUpdated, ModPackMetaData old = null)
        {
            Type = type;
            NewOrUpdated = newOrUpdated;
            Old = old;
        }
    }

    public enum ModPackFilesChangedType
    {
        Create,
        Delete
    }

    public class ModPackFilesChangedEventArgs
    {
        public ModPackFilesChangedType Type { get; }
        public string ModPack { get; }
        public IList<ModPackFileMetaData> Files { get; }

        public ModPackFilesChangedEventArgs(ModPackFilesChangedType type, string modPack, IList<ModPackFileMetaData> files)
        {
            Type = type;
            ModPack = modPack;
            Files = files;
        }
    }
}
