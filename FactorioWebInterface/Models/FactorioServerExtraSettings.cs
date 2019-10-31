using Newtonsoft.Json;
using System.ComponentModel;
using System.Text.Json.Serialization;

namespace FactorioWebInterface.Models
{
    public class FactorioServerExtraSettings
    {
        [DefaultValue(true)]
        [JsonProperty(PropertyName = "SyncBans", DefaultValueHandling = DefaultValueHandling.Populate)]
        [JsonPropertyName("SyncBans")]
        public bool SyncBans { get; set; }

        [DefaultValue(true)]
        [JsonProperty(PropertyName = "BuildBansFromDatabaseOnStart", DefaultValueHandling = DefaultValueHandling.Populate)]
        [JsonPropertyName("BuildBansFromDatabaseOnStart")]
        public bool BuildBansFromDatabaseOnStart { get; set; }

        [DefaultValue(true)]
        [JsonProperty(PropertyName = "SetDiscordChannelName", DefaultValueHandling = DefaultValueHandling.Populate)]
        [JsonPropertyName("SetDiscordChannelName")]
        public bool SetDiscordChannelName { get; set; }

        [DefaultValue(true)]
        [JsonProperty(PropertyName = "GameChatToDiscord", DefaultValueHandling = DefaultValueHandling.Populate)]
        [JsonPropertyName("GameChatToDiscord")]
        public bool GameChatToDiscord { get; set; }

        [DefaultValue(true)]
        [JsonProperty(PropertyName = "GameShoutToDiscord", DefaultValueHandling = DefaultValueHandling.Populate)]
        [JsonPropertyName("GameShoutToDiscord")]
        public bool GameShoutToDiscord { get; set; }

        [DefaultValue(true)]
        [JsonProperty(PropertyName = "DiscordToGameChat", DefaultValueHandling = DefaultValueHandling.Populate)]
        [JsonPropertyName("DiscordToGameChat")]
        public bool DiscordToGameChat { get; set; }

        public static FactorioServerExtraSettings MakeDefault()
        {
            return new FactorioServerExtraSettings()
            {
                SyncBans = true,
                BuildBansFromDatabaseOnStart = true,
                SetDiscordChannelName = true,
                GameChatToDiscord = true,
                GameShoutToDiscord = true,
                DiscordToGameChat = true
            };
        }

        public FactorioServerExtraSettings Copy()
        {
            return new FactorioServerExtraSettings()
            {
                SyncBans = SyncBans,
                BuildBansFromDatabaseOnStart = BuildBansFromDatabaseOnStart,
                SetDiscordChannelName = SetDiscordChannelName,
                GameChatToDiscord = GameChatToDiscord,
                GameShoutToDiscord = GameShoutToDiscord,
                DiscordToGameChat = DiscordToGameChat
            };
        }
    }
}
