using Newtonsoft.Json;
using System.ComponentModel;
using System.Text.Json.Serialization;

namespace FactorioWebInterface.Models
{
    public class ServerBan
    {
        [JsonProperty(PropertyName = "username")]
        [JsonPropertyName("username")]
        public string? Username { get; set; }

        [JsonProperty(PropertyName = "reason")]
        [JsonPropertyName("reason")]
        [DefaultValue("")]
        public string? Reason { get; set; }

        [JsonProperty(PropertyName = "address")]
        [JsonPropertyName("address")]
        [DefaultValue(null)]
        public string? Address { get; set; }
    }
}
