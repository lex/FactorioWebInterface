using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace FactorioWebInterface.Data
{
    // Add-Migration InitialCreate
    // Update-Database

    public class ApplicationDbContext : IdentityDbContext<ApplicationUser, IdentityRole, string>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<DiscordServers> DiscordServers { get; set; } = default!;
        public DbSet<NamedDiscordChannel> NamedDiscordChannels { get; set; } = default!;
        public DbSet<Admin> Admins { get; set; } = default!;
        public DbSet<Ban> Bans { get; set; } = default!;

        /// <summary>
        /// This just changes the default names for the tables, because I didn't like all the tables
        /// being called 'AspNetTableName'.
        /// </summary>
        /// <param name="modelBuilder"></param>
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<NamedDiscordChannel>().Property(x => x.Name).HasColumnType("TEXT COLLATE NOCASE");

            modelBuilder.Entity<Ban>().Property(x => x.Username).HasColumnType("TEXT COLLATE NOCASE");

            modelBuilder.Entity<ApplicationUser>(b =>
            {
                b.ToTable("Users");
            });

            modelBuilder.Entity<IdentityUserClaim<string>>(b =>
            {
                b.ToTable("UserClaims");
            });

            modelBuilder.Entity<IdentityUserLogin<string>>(b =>
            {
                b.ToTable("UserLogins");
            });

            modelBuilder.Entity<IdentityUserToken<string>>(b =>
            {
                b.ToTable("UserTokens");
            });

            modelBuilder.Entity<IdentityRole>(b =>
            {
                b.ToTable("Roles");
            });

            modelBuilder.Entity<IdentityRoleClaim<string>>(b =>
            {
                b.ToTable("RoleClaims");
            });

            modelBuilder.Entity<IdentityUserRole<string>>(b =>
            {
                b.ToTable("UserRoles");
            });
        }
    }
}
