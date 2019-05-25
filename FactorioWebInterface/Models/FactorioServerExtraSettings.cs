using Newtonsoft.Json;
using System.ComponentModel;

namespace FactorioWebInterface.Models
{
    public class FactorioServerExtraSettings
    {
        [DefaultValue(true)]
        [JsonProperty(DefaultValueHandling = DefaultValueHandling.Populate)]
        public bool SyncBans { get; set; }

        [DefaultValue(true)]
        [JsonProperty(DefaultValueHandling = DefaultValueHandling.Populate)]
        public bool BuildBansFromDatabaseOnStart { get; set; }

        [DefaultValue(true)]
        [JsonProperty(DefaultValueHandling = DefaultValueHandling.Populate)]
        public bool SetDiscordChannelName { get; set; }

        [DefaultValue(true)]
        [JsonProperty(DefaultValueHandling = DefaultValueHandling.Populate)]
        public bool GameChatToDiscord { get; set; }

        [DefaultValue(true)]
        [JsonProperty(DefaultValueHandling = DefaultValueHandling.Populate)]
        public bool GameShoutToDiscord { get; set; }

        [DefaultValue(true)]
        [JsonProperty(DefaultValueHandling = DefaultValueHandling.Populate)]
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
