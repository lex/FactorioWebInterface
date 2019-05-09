using FactorioWebInterface.Data;

namespace FactorioWebInterface.Models
{
    public class ScenarioDataEntryChangedEventArgs
    {
        public ScenarioDataEntry ScenarioDataEntry { get; }
        public string Source { get; }

        public ScenarioDataEntryChangedEventArgs(ScenarioDataEntry scenarioDataEntry, string source)
        {
            ScenarioDataEntry = scenarioDataEntry;
            Source = source;
        }
    }
}
