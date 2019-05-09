using Newtonsoft.Json;
using System.ComponentModel.DataAnnotations;

namespace FactorioWebInterface.Data
{
    public class ScenarioDataEntry
    {
        [JsonProperty(PropertyName = "data_set")]
        public string DataSet { get; set; }

        [JsonProperty(PropertyName = "key")]
        public string Key { get; set; }

        [Required]
        [JsonProperty(PropertyName = "value")]
        public string Value { get; set; }
    }

    public class ScenarioDataKeyValue
    {
        [JsonProperty(PropertyName = "key")]
        public string Key { get; set; }

        [Required]
        [JsonProperty(PropertyName = "value")]
        public string Value { get; set; }
    }
}
