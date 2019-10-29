using Microsoft.EntityFrameworkCore;

namespace FactorioWebInterface.Data
{
    public class ScenarioDbContext : DbContext
    {
        public DbSet<ScenarioDataEntry> ScenarioDataEntries { get; set; } = default!;

        public ScenarioDbContext(DbContextOptions<ScenarioDbContext> options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ScenarioDataEntry>()
                 .HasKey(e => new { e.DataSet, e.Key });

            modelBuilder.Entity<ScenarioDataEntry>()
                 .HasIndex(e => e.DataSet);
        }
    }
}
