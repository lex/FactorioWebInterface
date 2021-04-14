using System.Text.Json.Serialization;

namespace FactorioWebInterface.Models
{
    public record StartGameData
    {
        [JsonPropertyName("type")]
        public string? Type { get; init; }

        [JsonPropertyName("name")]
        public string Name { get; init; } = "";

        [JsonPropertyName("mod_pack")]
        public string? ModPack { get; init; }

        public static class GameType
        {
            public const string Scenario = "scenario";
            public const string Save = "save";
        }
    }
}
