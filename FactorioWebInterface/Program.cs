using FactorioWebInterface.Data;
using FactorioWebInterface.Options;
using FactorioWebInterface.Services;
using FactorioWebInterface.Services.Discord;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
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

                // This makes sure the databases are setup.
                SeedData(host);

                var services = host.Services;

                await Task.WhenAll(
                    services.GetService<IFactorioServerDataService>().Init(),
                    services.GetService<DiscordBot>().Init(),
                    services.GetService<IDiscordService>().Init());

                // This makes sure the FactorioServerManger is started when the web interface starts.
                services.GetService<IFactorioServerManager>();
                services.GetService<BanHubEventHandlerService>();
                services.GetService<FactorioAdminServiceEventHandlerService>();

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

        private static void SeedData(IHost host)
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

                _ = DefaultUserAsync(services);
            }
        }

        private static async Task DefaultUserAsync(IServiceProvider services)
        {
            DefaultAdminAccountOption option = services.GetRequiredService<IOptions<DefaultAdminAccountOption>>().Value;

            Console.WriteLine(option.Enabled.ToString());

            String id = DefaultAdminAccountOption.DefaultAdminAccount;
            var _userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
            ApplicationUser userResult = await _userManager.FindByIdAsync(id);

            if (userResult != null)
            {
                var deleteResult = await _userManager.DeleteAsync(userResult);
                if (!deleteResult.Succeeded)
                {
                    var lockoutResult = await _userManager.SetLockoutEnabledAsync(userResult, true);
                    if (lockoutResult.Succeeded)
                    {
                        Log.Information(DefaultAdminAccountOption.DefaultAdminAccount + " couldn't be deleted, locking out account instead");
                    }
                    return;
                }
                Log.Information(DefaultAdminAccountOption.DefaultAdminAccount + " deleted");
            }

            if (!option.Enabled)
            {
                return;
            }

            ApplicationUser user = new ApplicationUser()
            {
                Id = id,
                UserName = option.Username
            };

            var result = await _userManager.CreateAsync(user);
            if (!result.Succeeded)
            {
                Log.Error("Couldn't create " + DefaultAdminAccountOption.DefaultAdminAccount);
                return;
            }

            result = await _userManager.AddToRoleAsync(user, Constants.AdminRole);
            if (!result.Succeeded)
            {
                Log.Error("Couldn't add role to " + DefaultAdminAccountOption.DefaultAdminAccount);
                return;
            }
            string unsafePassword = "administrator";
            result = await _userManager.AddPasswordAsync(user, unsafePassword);
            if (!result.Succeeded)
            {
                Log.Error("Couldn't add password to " + DefaultAdminAccountOption.DefaultAdminAccount);
                return;
            }
            Log.Information(DefaultAdminAccountOption.DefaultAdminAccount + " named \'" + option.Username + "\' created with the unsafe password: " + unsafePassword);
        }
    }
}
