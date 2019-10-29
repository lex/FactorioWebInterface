using Newtonsoft.Json;
using System.ComponentModel.DataAnnotations;

namespace FactorioWebInterface.Data
{
    public class ScenarioDataEntry
    {
        [JsonProperty(PropertyName = "data_set")]
        public string DataSet { get; set; } = default!;

        [JsonProperty(PropertyName = "key")]
        public string Key { get; set; } = default!;

        [Required]
        [JsonProperty(PropertyName = "value")]
        public string Value { get; set; } = default!;
    }

    public class ScenarioDataKeyValue
    {
        [JsonProperty(PropertyName = "key")]
        public string Key { get; set; } = default!;

        [Required]
        [JsonProperty(PropertyName = "value")]
        public string Value { get; set; } = default!;
    }
}
