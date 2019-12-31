using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;

namespace FactorioWebInterface.Services.Discord
{
    public interface IDiscordServiceConfiguration
    {
        HashSet<ulong> AdminRoleIds { get; }
        ulong GuildId { get; }
    }

    public class DiscordServiceConfiguration : IDiscordServiceConfiguration
    {
        private class Role
        {
            public string? Name { get; set; }
            public ulong Id { get; set; }
        }

        private class AdminRoles
        {
            public Role[] Roles { get; set; } = Array.Empty<Role>();
        }

        public ulong GuildId { get; }
        public HashSet<ulong> AdminRoleIds { get; }

        public DiscordServiceConfiguration(IConfiguration configuration)
        {
            GuildId = ulong.Parse(configuration[Constants.GuildIDKey]);

            var adminRoles = new AdminRoles();
            configuration.GetSection(Constants.AdminRolesKey).Bind(adminRoles);

            AdminRoleIds = adminRoles.Roles.Select(r => r.Id).ToHashSet();
        }

        internal DiscordServiceConfiguration(ulong guildId, HashSet<ulong> adminRoleIds)
        {
            GuildId = guildId;
            AdminRoleIds = adminRoleIds;
        }
    }
}
