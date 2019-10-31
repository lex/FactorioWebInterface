using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace FactorioWebInterface.Data
{
    public class DiscordServers
    {
        [Key]
        public ulong DiscordChannelId { get; set; } = default!;
        public string ServerId { get; set; } = default!;
    }
}
