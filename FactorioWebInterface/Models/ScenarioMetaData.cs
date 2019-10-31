using System;

namespace FactorioWebInterface.Models
{
    public class ScenarioMetaData
    {
        public string Name { get; set; } = default!;
        public DateTime CreatedTime { get; set; }
        public DateTime LastModifiedTime { get; set; }
    }
}
