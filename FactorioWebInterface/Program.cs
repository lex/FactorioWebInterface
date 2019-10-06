using FactorioWebInterface.Data;
using FactorioWebInterface.Services;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Serilog;
using Serilog.Events;
using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.CompilerServices;

[assembly: InternalsVisibleTo("FactorioWebInterfaceTests")]

namespace FactorioWebInterface
{
    public class Program
    {
        public static void Main(string[] args)
        {
            string path = AppDomain.CurrentDomain.BaseDirectory;
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

                // This makes sure the databases are setup.
                SeedData(host);

                host.Services.GetService<IFactorioServerDataService>().Init();

                // This makes sure the FactorioServerManger is started when the web interface starts.
                host.Services.GetService<IFactorioServerManager>();
                host.Services.GetService<DiscordBot>();
                host.Services.GetService<BanHubEventHandlerService>();
                host.Services.GetService<FactorioAdminManagerEventHandlerService>();

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

        public static IWebHostBuilder CreateWebHostBuilder(string[] args) =>
            WebHost.CreateDefaultBuilder(args)
                .UseStartup<Startup>()
                .UseKestrel(o => o.Limits.MaxRequestBodySize = 1073741824) // 1GB.
                .UseSerilog();

        private static void SeedData(IWebHost host)
        {
            using (var scope = host.Services.CreateScope())
            {
                var services = scope.ServiceProvider;

                var appDb = services.GetService<ApplicationDbContext>();
                appDb.Database.Migrate();

                var scenarioDb = services.GetService<ScenarioDbContext>();
                scenarioDb.Database.Migrate();

                var roleManager = services.GetService<RoleManager<IdentityRole>>();

                roleManager.CreateAsync(new IdentityRole(Constants.RootRole));
                roleManager.CreateAsync(new IdentityRole(Constants.AdminRole));
            }
        }
    }
}
