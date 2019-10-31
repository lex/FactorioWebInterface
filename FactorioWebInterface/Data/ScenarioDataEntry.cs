using Newtonsoft.Json;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace FactorioWebInterface.Data
{
    public class ScenarioDataEntry
    {
        [JsonProperty(PropertyName = "data_set")]
        [JsonPropertyName("data_set")]
        public string DataSet { get; set; } = default!;

        [JsonProperty(PropertyName = "key")]
        [JsonPropertyName("key")]
        public string Key { get; set; } = default!;

        [Required]
        [JsonProperty(PropertyName = "value")]
        [JsonPropertyName("value")]
        public string Value { get; set; } = default!;
    }

    public class ScenarioDataKeyValue
    {
        [JsonProperty(PropertyName = "key")]
        [JsonPropertyName("key")]
        public string Key { get; set; } = default!;

        [Required]
        [JsonProperty(PropertyName = "value")]
        [JsonPropertyName("value")]
        public string Value { get; set; } = default!;
    }
}
