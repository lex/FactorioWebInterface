using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.ComponentModel;

namespace FactorioWebInterface.Models
{
    public class FactorioServerSettings
    {
        [JsonProperty(PropertyName = "name")]
        public string Name { get; set; }

        [JsonProperty(PropertyName = "description")]
        public string Description { get; set; }

        [JsonProperty(PropertyName = "tags")]
        public List<string> Tags { get; set; }

        [JsonProperty(PropertyName = "max_players")]
        public int MaxPlayers { get; set; }

        [JsonProperty(PropertyName = "visibility")]
        public FactorioServerSettingsConfigVisibility Visibility { get; set; }

        [JsonProperty(PropertyName = "username")]
        public string Username { get; set; }

        [JsonProperty(PropertyName = "token")]
        public string Token { get; set; }

        [JsonProperty(PropertyName = "game_password")]
        public string GamePassword { get; set; }

        [JsonProperty(PropertyName = "require_user_verification")]
        public bool RequireUserVerification { get; set; }

        [JsonProperty(PropertyName = "max_upload_in_kilobytes_per_second")]
        public double MaxUploadInKilobytesPerSecond { get; set; }

        [JsonProperty(PropertyName = "max_upload_slots")]
        public int MaxUploadSlots { get; set; }

        [JsonProperty(PropertyName = "minimum_latency_in_ticks")]
        public int MinimumLatencyInTicks { get; set; }

        [JsonProperty(PropertyName = "ignore_player_limit_for_returning_players")]
        public bool IgnorePlayerLimitForReturningPlayers { get; set; }

        [JsonProperty(PropertyName = "allow_commands")]
        public string AllowCommands { get; set; }

        [JsonProperty(PropertyName = "autosave_interval")]
        public int AutosaveInterval { get; set; }

        [JsonProperty(PropertyName = "autosave_slots")]
        public int AutosaveSlots { get; set; }

        [JsonProperty(PropertyName = "afk_autokick_interval")]
        public int AfkAutokickInterval { get; set; }

        [JsonProperty(PropertyName = "auto_pause")]
        public bool AutoPause { get; set; }

        [JsonProperty(PropertyName = "use_default_admins", DefaultValueHandling = DefaultValueHandling.Populate)]
        [DefaultValue(true)]
        public bool UseDefaultAdmins { get; set; }

        [JsonProperty(PropertyName = "only_admins_can_pause_the_game")]
        public bool OnlyAdminsCanPauseTheGame { get; set; }

        [JsonProperty(PropertyName = "autosave_only_on_server", DefaultValueHandling = DefaultValueHandling.Populate)]
        [DefaultValue(true)]
        public bool AutosaveOnlyOnServer { get; set; }

        [JsonProperty(PropertyName = "non_blocking_saving")]
        public bool NonBlockingSaving { get; set; }

        public static FactorioServerSettings MakeDefault(IConfiguration configuration) => new FactorioServerSettings()
        {
            Name = "The server's name.",
            Description = "The server's description.",
            Tags = new List<string>() { "The", "Server's", "Tags" },
            MaxPlayers = 0,
            Visibility = new FactorioServerSettingsConfigVisibility() { Public = true, Lan = true },
            Username = configuration[Constants.ServerSettingsUsernameKey],
            Token = configuration[Constants.ServerSettingsTokenKey],
            GamePassword = "",
            RequireUserVerification = true,
            MaxUploadInKilobytesPerSecond = 0,
            MaxUploadSlots = 32,
            MinimumLatencyInTicks = 0,
            IgnorePlayerLimitForReturningPlayers = false,
            AllowCommands = FactorioServerSettingsConfigAllowCommands.AdminsOnly,
            AutosaveInterval = 5,
            AutosaveSlots = 20,
            AfkAutokickInterval = 0,
            AutoPause = true,
            UseDefaultAdmins = true,
            OnlyAdminsCanPauseTheGame = true,
            AutosaveOnlyOnServer = true,
            NonBlockingSaving = false
        };
    }

    public class FactorioServerSettingsConfigVisibility
    {
        [JsonProperty(PropertyName = "public")]
        public bool Public { get; set; }
        [JsonProperty(PropertyName = "lan")]
        public bool Lan { get; set; }
    }

    public static class FactorioServerSettingsConfigAllowCommands
    {
        public const string False = "false";
        public const string True = "true";
        public const string AdminsOnly = "admins-only";
    }
}
