using Newtonsoft.Json;
using System.ComponentModel;
using System.Text.Json.Serialization;

namespace FactorioWebInterface.Models
{
    public class FactorioServerExtraData
    {
        [DefaultValue("")]
        [JsonProperty(PropertyName = "SelectedModPack", DefaultValueHandling = DefaultValueHandling.Populate)]
        [JsonPropertyName("SelectedModPack")]
        public string SelectedModPack { get; set; } = "";
    }
}
