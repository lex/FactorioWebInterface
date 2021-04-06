using FactorioWebInterface.Data;
using FactorioWebInterface.Services;
using FactorioWebInterface.Services.Discord;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Serilog;
using Serilog.Events;
using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;

[assembly: InternalsVisibleTo("FactorioWebInterfaceTests")]

namespace FactorioWebInterface
{
    public static class Program
    {
        public static async Task Main(string[] args)
        {
            string path = AppDomain.CurrentDomain.BaseDirectory!;
            path = Path.Combine(path, "logs/log.txt");

            Log.Logger = new LoggerConfiguration()
           .MinimumLevel.Debug()
           .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
           .Enrich.FromLogContext()
           .WriteTo.Console()
           .WriteTo.Async(a => a.File(path, rollingInterval: RollingInterval.Day))
           .CreateLogger();

            try
            {
                Log.Information("Starting factorio web interface");

                var host = CreateWebHostBuilder(args).Build();
                var services = host.Services;

                await Task.WhenAll(
                    // This makes sure the databases are setup.
                    SeedData(host),
                    services.GetRequiredService<IFactorioServerDataService>().Init(),
                    services.GetRequiredService<DiscordBot>().Init(),
                    services.GetRequiredService<IDiscordService>().Init());

                // This makes sure the FactorioServerManger is started when the web interface starts.
                services.GetRequiredService<IFactorioServerManager>();
                services.GetRequiredService<BanHubEventHandlerService>();
                services.GetRequiredService<FactorioAdminServiceEventHandlerService>();

                host.Run();
            }
            catch (Exception e)
            {
                Log.Fatal(e, "Host terminated unexpectedly");
                Debugger.Break();
            }
            finally
            {
                Log.CloseAndFlush();
            }
        }

        public static IHostBuilder CreateWebHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
            .ConfigureWebHostDefaults(webBuilder =>
            {
                webBuilder.ConfigureKestrel(serverOptions =>
                {
                    serverOptions.Limits.MaxRequestBodySize = 1073741824; // 1GB.
                })
                .UseStartup<Startup>()
                .UseSerilog();
            });

        private static async Task SeedData(IHost host)
        {
            using (var scope = host.Services.CreateScope())
            {
                var services = scope.ServiceProvider;

                var appDb = services.GetRequiredService<ApplicationDbContext>();
                appDb.Database.Migrate();

                var scenarioDb = services.GetRequiredService<ScenarioDbContext>();
                scenarioDb.Database.Migrate();

                var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();

                await roleManager.CreateAsync(new IdentityRole(Constants.RootRole));
                await roleManager.CreateAsync(new IdentityRole(Constants.AdminRole));

                await services.GetRequiredService<IDefaultAdminAccountService>().SetupDefaultUserAsync();
            }
        }
    }
}
