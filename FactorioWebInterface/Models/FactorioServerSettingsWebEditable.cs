using Newtonsoft.Json;
using System;
using System.Collections.Generic;

namespace FactorioWebInterface.Models
{
    public class FactorioServerSettingsWebEditable
    {
        [JsonProperty(PropertyName = "name")]
        public string Name { get; set; } = default!;

        [JsonProperty(PropertyName = "description")]
        public string Description { get; set; } = default!;

        [JsonProperty(PropertyName = "tags")]
        public string[] Tags { get; set; } = default!;

        [JsonProperty(PropertyName = "max_players")]
        public int MaxPlayers { get; set; }

        [JsonProperty(PropertyName = "game_password")]
        public string GamePassword { get; set; } = default!;

        [JsonProperty(PropertyName = "max_upload_slots")]
        public int MaxUploadSlots { get; set; }

        [JsonProperty(PropertyName = "auto_pause")]
        public bool AutoPause { get; set; }

        [JsonProperty(PropertyName = "use_default_admins")]
        public bool UseDefaultAdmins { get; set; }

        [JsonProperty(PropertyName = "admins")]
        public string[] Admins { get; set; } = default!;

        [JsonProperty(PropertyName = "autosave_interval")]
        public int AutosaveInterval { get; set; }

        [JsonProperty(PropertyName = "autosave_slots")]
        public int AutosaveSlots { get; set; }

        [JsonProperty(PropertyName = "non_blocking_saving")]
        public bool NonBlockingSaving { get; set; }

        [JsonProperty(PropertyName = "public_visible")]
        public bool PublicVisible { get; set; }

        public static FactorioServerSettingsWebEditable MakeDefault() => new FactorioServerSettingsWebEditable()
        {
            Name = "The server's name.",
            Description = "The server's description.",
            Tags = new string[] { "The", "Server's", "Tags" },
            MaxPlayers = 0,
            GamePassword = "",
            MaxUploadSlots = 32,
            AutosaveInterval = 5,
            AutosaveSlots = 20,
            AutoPause = true,
            UseDefaultAdmins = true,
            Admins = Array.Empty<string>(),
            NonBlockingSaving = false,
            PublicVisible = true
        };
    }
}
