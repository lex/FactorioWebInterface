using Newtonsoft.Json;
using System.ComponentModel;

namespace FactorioWebInterface.Models
{
    public class ServerBan
    {
        [JsonProperty(PropertyName = "username")]
        public string? Username { get; set; }

        [JsonProperty(PropertyName = "reason")]
        [DefaultValue("")]
        public string? Reason { get; set; }

        [JsonProperty(PropertyName = "address")]
        [DefaultValue(null)]
        public string? Address { get; set; }
    }
}
