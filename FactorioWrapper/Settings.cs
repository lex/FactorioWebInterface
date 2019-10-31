using Newtonsoft.Json;
using System.Text.Json.Serialization;

namespace FactorioWrapper
{
    public class Settings
    {
        [JsonProperty(PropertyName = "token")]
        [JsonPropertyName("token")]
        public string Token { get; set; }

        [JsonProperty(PropertyName = "url")]
        [JsonPropertyName("url")]
        public string Url { get; set; }
    }
}
