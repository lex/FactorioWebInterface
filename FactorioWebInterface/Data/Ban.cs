using Newtonsoft.Json;
using System;
using System.ComponentModel.DataAnnotations;

namespace FactorioWebInterface.Data
{
    public class Ban
    {
        // Decoding the default DateTime causes errors with message pack.
        private static readonly DateTime dummyDate = new DateTime(1970, 1, 1);

        [Key]
        [JsonProperty(PropertyName = "username")]
        public string Username { get; set; }

        [JsonProperty(PropertyName = "reason")]
        public string Reason { get; set; }

        public string Address { get; set; }

        [JsonProperty(PropertyName = "admin")]
        public string Admin { get; set; }

        [JsonProperty(PropertyName = "dateTime")]
        public DateTime DateTime { get; set; } = dummyDate;
    }
}
