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
        public bool SyncBans { get; set; } = true;

        [DefaultValue(true)]
        [JsonProperty(PropertyName = "BuildBansFromDatabaseOnStart", DefaultValueHandling = DefaultValueHandling.Populate)]
        [JsonPropertyName("BuildBansFromDatabaseOnStart")]
        public bool BuildBansFromDatabaseOnStart { get; set; } = true;

        [DefaultValue(true)]
        [JsonProperty(PropertyName = "SetDiscordChannelName", DefaultValueHandling = DefaultValueHandling.Populate)]
        [JsonPropertyName("SetDiscordChannelName")]
        public bool SetDiscordChannelName { get; set; } = true;

        [DefaultValue(true)]
        [JsonProperty(PropertyName = "SetDiscordChannelTopic", DefaultValueHandling = DefaultValueHandling.Populate)]
        [JsonPropertyName("SetDiscordChannelTopic")]
        public bool SetDiscordChannelTopic { get; set; } = true;

        [DefaultValue(true)]
        [JsonProperty(PropertyName = "GameChatToDiscord", DefaultValueHandling = DefaultValueHandling.Populate)]
        [JsonPropertyName("GameChatToDiscord")]
        public bool GameChatToDiscord { get; set; } = true;

        [DefaultValue(true)]
        [JsonProperty(PropertyName = "GameShoutToDiscord", DefaultValueHandling = DefaultValueHandling.Populate)]
        [JsonPropertyName("GameShoutToDiscord")]
        public bool GameShoutToDiscord { get; set; } = true;

        [DefaultValue(true)]
        [JsonProperty(PropertyName = "DiscordToGameChat", DefaultValueHandling = DefaultValueHandling.Populate)]
        [JsonPropertyName("DiscordToGameChat")]
        public bool DiscordToGameChat { get; set; } = true;

        [DefaultValue(true)]
        [JsonProperty(PropertyName = "PingDiscordCrashRole", DefaultValueHandling = DefaultValueHandling.Populate)]
        [JsonPropertyName("PingDiscordCrashRole")]
        public bool PingDiscordCrashRole { get; set; } = true;

        public static FactorioServerExtraSettings MakeDefault()
        {
            return new FactorioServerExtraSettings()
            {
                SyncBans = true,
                BuildBansFromDatabaseOnStart = true,
                SetDiscordChannelName = true,
                SetDiscordChannelTopic = true,
                GameChatToDiscord = true,
                GameShoutToDiscord = true,
                DiscordToGameChat = true,
                PingDiscordCrashRole = true
            };
        }

        public FactorioServerExtraSettings Copy()
        {
            return new FactorioServerExtraSettings()
            {
                SyncBans = SyncBans,
                BuildBansFromDatabaseOnStart = BuildBansFromDatabaseOnStart,
                SetDiscordChannelName = SetDiscordChannelName,
                SetDiscordChannelTopic = SetDiscordChannelTopic,
                GameChatToDiscord = GameChatToDiscord,
                GameShoutToDiscord = GameShoutToDiscord,
                DiscordToGameChat = DiscordToGameChat,
                PingDiscordCrashRole = PingDiscordCrashRole
            };
        }
    }
}
