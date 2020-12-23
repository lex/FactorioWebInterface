using System.ComponentModel.DataAnnotations;

namespace FactorioWebInterface.Data
{
    public class NamedDiscordChannel
    {
        public ulong DiscordChannelId { get; set; }
        [Key]
        public string Name { get; set; } = default!;
    }
}
