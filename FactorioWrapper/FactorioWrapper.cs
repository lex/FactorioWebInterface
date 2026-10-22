using Newtonsoft.Json;
using Serilog;
using System;
using System.IO;
using System.Linq;

namespace FactorioWrapper
{
    public class FactorioWrapper
    {
#if WINDOWS
        private const string url = "https://localhost:44303/factorioProcessHub";
#elif WSL        
        private const string url = "https://localhost:5000/factorioProcessHub";
#else    
        // This only works if connecting from a differnt ip.
        //private const string url = "http://88.99.214.198/factorioProcessHub";

        // If the wrapper is on the same ip as the web interface only localhost seems to work. Before the ip worked, but not anymore.
        private const string url = "http://localhost/factorioProcessHub";
#endif

        public static void Main(string[] args)
        {
            string logPath = args.Length == 0
                ? "logs/log.txt"
                : $"logs/{args[0]}/log.txt";

            string basePath = AppDomain.CurrentDomain.BaseDirectory;
            string fullLogPath = Path.Combine(basePath, logPath);
            string fullSettignsPath = Path.Combine(basePath, "settings.json");

            Log.Logger = new LoggerConfiguration()
                .MinimumLevel.Information()
                .WriteTo.Async(a => a.File(fullLogPath, rollingInterval: RollingInterval.Day))
                .CreateLogger();

            try
            {
                if (!File.Exists(fullSettignsPath))
                {
                    Log.Fatal("Missing settings.json");
                    return;
                }

                string data = File.ReadAllText(fullSettignsPath);
                var settings = JsonConvert.DeserializeObject<Settings>(data);

                if (settings.Token == null)
                {
                    settings.Token = "";
                }

                if (string.IsNullOrWhiteSpace(settings.Url))
                {
                    settings.Url = url;
                }

                // The password is passed to factorio as a command line argument, so it can't contain whitespace or quotes.
                if (settings.RconPassword != null && settings.RconPassword.Any(c => char.IsWhiteSpace(c) || c == '"'))
                {
                    Log.Fatal("rcon_password in settings.json must not contain whitespace or quotes");
                    return;
                }

                if (args.Length < 3)
                {
                    Log.Fatal("Missing arguments");
                    return;
                }

                string serverId = args[0];
                string factorioFileName = args[1];
                string factorioArguments = string.Join(" ", args, 2, args.Length - 2);

                Log.Information("Starting wrapper serverId: {serverId} factorioFileName: {factorioFileName} factorioArguments: {factorioArguments}", serverId, factorioFileName, factorioArguments);

                using (var mainLoop = new MainLoop(settings, serverId, factorioFileName, factorioArguments))
                {
                    mainLoop.Run();
                }
            }
            catch (Exception e)
            {
                Log.Error(e, "Wrapper Exception");
            }
            finally
            {
                Log.Information("Exiting wrapper");
                Log.CloseAndFlush();
            }
        }
    }
}
