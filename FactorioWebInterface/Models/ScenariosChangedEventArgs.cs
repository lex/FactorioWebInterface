using System;
using System.Collections.Generic;

namespace FactorioWebInterface.Models
{
    public enum ScenariosChangedType
    {
        Create,
        Delete,
        Rename
    }

    public class ScenariosChangedEventArgs
    {
        public ScenariosChangedType Type { get; }
        public IList<ScenarioMetaData> NewOrUpdated { get; }
        public IList<ScenarioMetaData> Old { get; }

        public ScenariosChangedEventArgs(ScenariosChangedType type, IList<ScenarioMetaData> newOrUpdated, IList<ScenarioMetaData> old = null)
        {
            Type = type;
            NewOrUpdated = newOrUpdated;
            Old = old ?? Array.Empty<ScenarioMetaData>();
        }
    }
}
