﻿using FactorioWrapperInterface;
using Microsoft.AspNetCore.SignalR.Client;
using Serilog;
using System;
using System.Diagnostics;
using System.IO;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

namespace FactorioWrapper
{
    class FactorioWrapper
    {
#if WINDOWS
        private static readonly string url = "https://localhost:44303/factorioProcessHub";
#elif WSL
        private static readonly string url = "http://localhost/factorioProcessHub";
#else    
        // This only works if connecting from a differnt ip.
        //private static readonly string url = "http://88.99.214.198/factorioProcessHub";

        // If the wrapper is on the same ip as the web interface only localhost seems to work. Before the ip worked, but not anymore.
        private static readonly string url = "http://localhost/factorioProcessHub";
#endif

        private static TimeSpan updateTimeInterval = TimeSpan.FromMinutes(1);
        private static DateTime unixEpoch = new DateTime(1970, 1, 1);

        // This is to stop multiple threads writing to the factorio process concurrently.
        private static SemaphoreSlim factorioProcessLock = new SemaphoreSlim(1, 1);

        public static Regex outputRegex = new Regex(@"\d+\.\d+ (.+)", RegexOptions.Compiled);

        private static volatile bool exit = false;
        private static DateTime lastUpdateTime;
        private static volatile HubConnection connection;
        private static volatile bool connected = false;
        private static volatile Process factorioProcess;
        private static string factorioFileName;
        private static string factorioArguments;
        private static string serverId;
        private static volatile FactorioServerStatus status = FactorioServerStatus.WrapperStarting;
        private static string token;

        public static void Main(string[] args)
        {
            string logPath = args.Length == 0
                ? "logs/log.txt"
                : $"logs/{args[0]}/log.txt";

            string basePath = AppDomain.CurrentDomain.BaseDirectory;
            string fullLogPath = Path.Combine(basePath, logPath);
            string fullTokenPath = Path.Combine(basePath, "token.txt");

            Log.Logger = new LoggerConfiguration()
                .MinimumLevel.Information()
                .WriteTo.Async(a => a.File(fullLogPath, rollingInterval: RollingInterval.Day))
                .CreateLogger();

            try
            {
                token = File.ReadAllText(fullTokenPath);
                Log.Information("token read: {token}", token);
                MainAsync(args).GetAwaiter().GetResult();
            }
            catch (Exception e)
            {
                Log.Error(e, "Wrapper Exception");
            }
            finally
            {
                if (connection != null)
                {
                    connection.StopAsync().GetAwaiter().GetResult();
                    connection.DisposeAsync().GetAwaiter().GetResult();
                }
                Log.CloseAndFlush();
            }
        }

        private static async Task MainAsync(string[] args)
        {
            if (args.Length < 3)
            {
                Log.Fatal("Missing arguments");
                return;
            }

            serverId = args[0];
            factorioFileName = args[1];
            factorioArguments = string.Join(" ", args, 2, args.Length - 2);

            Log.Information("Starting wrapper serverId: {serverId} factorioFileName: {factorioFileName} factorioArguments: {factorioArguments}", serverId, factorioFileName, factorioArguments);

            while (!exit)
            {
                try
                {
                    await RestartWrapperAsync();
                }
                catch (Exception e)
                {
                    Log.Error(e, "Wrapper Exception");
                }
            }

            switch (status)
            {
                case FactorioServerStatus.Stopping:
                    await ChangeStatus(FactorioServerStatus.Stopped);
                    break;
                case FactorioServerStatus.Killing:
                    await ChangeStatus(FactorioServerStatus.Killed);
                    break;
                case FactorioServerStatus.WrapperStarting:
                case FactorioServerStatus.WrapperStarted:
                case FactorioServerStatus.Starting:
                case FactorioServerStatus.Running:
                    await ChangeStatus(FactorioServerStatus.Crashed);
                    break;
                default:
                    Log.Error("Previous status {status} was unexpected when exiting wrapper.", status);
                    break;
            }

            await SendWrapperData("Exiting wrapper");
            Log.Information("Exiting wrapper");
        }

        private static async Task RestartWrapperAsync()
        {
            if (connection == null)
            {
                BuildConenction();
            }

            Log.Information("Starting connection");

            await Reconnect();

            if (factorioProcess == null && !exit)
            {
                await StartFactorioProcess();
            }

            while (!exit)
            {
                if (factorioProcess.HasExited)
                {
                    Log.Information("Factorio process exited");
                    exit = true;
                    return;
                }

                if (status == FactorioServerStatus.Running)
                {
                    var now = DateTime.UtcNow;
                    var diff = now - lastUpdateTime;
                    if (diff >= updateTimeInterval)
                    {
                        lastUpdateTime = now;
                        var command = BuildCurentTimeCommand(now);
                        _ = SendToFactorio(command);
                    }
                }

                await Task.Delay(1000);
            }
        }

        private static async Task SendToFactorio(string data)
        {
            try
            {
                await factorioProcessLock.WaitAsync();

                var p = factorioProcess;
                if (p != null && !p.HasExited)
                {
                    await p.StandardInput.WriteLineAsync(data);
                }
            }
            catch (Exception e)
            {
                Log.Error(e, "Error sending data to factorio process");
            }
            finally
            {
                factorioProcessLock.Release();
            }
        }

        private static void BuildConenction()
        {
            Log.Information("Building connection");

            connection = new HubConnectionBuilder()
                .WithUrl(url, options =>
                {
                    options.AccessTokenProvider = () => Task.FromResult(token);
                })
                .Build();

            connection.Closed += async (error) =>
            {
                connected = false;

                if (exit)
                {
                    return;
                }

                Log.Information("Lost connection");
                await Reconnect();
            };

            connection.On<string>(nameof(IFactorioProcessClientMethods.SendToFactorio), async data =>
            {
                await SendToFactorio(data);
            });

            connection.On(nameof(IFactorioProcessClientMethods.Stop), async () =>
            {
                try
                {
                    await factorioProcessLock.WaitAsync();

                    Log.Information("Stopping factorio server.");

                    var p = factorioProcess;
                    if (p != null && !p.HasExited)
                    {
                        Process.Start("kill", $"-sigterm {factorioProcess.Id}");
                    }

                    await ChangeStatus(FactorioServerStatus.Stopping);
                }
                catch (Exception e)
                {
                    Log.Error(e, "Error stopping factorio process");
                    await SendWrapperData("Error stopping factorio process");
                }
                finally
                {
                    // If an error is throw above the status wont be changed.
                    // This changes the status in case the factorio process hasn't started yet, to make sure it doesn't start.
                    status = FactorioServerStatus.Stopping;
                    factorioProcessLock.Release();
                }
            });

            connection.On(nameof(IFactorioProcessClientMethods.ForceStop), async () =>
            {
                try
                {
                    await factorioProcessLock.WaitAsync();

                    Log.Information("Killing factorio server.");

                    var p = factorioProcess;
                    if (p != null && !p.HasExited)
                    {
                        p.Kill();
                    }

                    await ChangeStatus(FactorioServerStatus.Killing);
                }
                catch (Exception e)
                {
                    Log.Error(e, "Error force killing factorio process");
                    await SendWrapperData("Error killing factorio process");
                }
                finally
                {
                    // If an error is throw above the status wont be changed.
                    // This changes the status in case the factorio process hasn't started yet, to make sure it doesn't start.
                    status = FactorioServerStatus.Killing;
                    factorioProcessLock.Release();
                }
            });

            // This is so the Server Control can get the status if a connection was lost.
            connection.On(nameof(IFactorioProcessClientMethods.GetStatus), async () =>
             {
                 Log.Information("Status requested");
                 await ChangeStatus(status);
             });
        }

        private static async Task StartFactorioProcess()
        {
            try
            {
                await factorioProcessLock.WaitAsync();

                // Check to see if the server has been requested to stop.
                if (status != FactorioServerStatus.WrapperStarted)
                {
                    exit = true;
                    return;
                }

                Log.Information("Starting factorio process factorioFileName: {factorioFileName} factorioArguments: {factorioArguments}", factorioFileName, factorioArguments);

                factorioProcess = new Process();
                var startInfo = factorioProcess.StartInfo;
                startInfo.FileName = factorioFileName;
                startInfo.Arguments = factorioArguments;
                startInfo.UseShellExecute = false;
                startInfo.CreateNoWindow = true;
                startInfo.RedirectStandardInput = true;
                startInfo.RedirectStandardOutput = true;
                startInfo.RedirectStandardError = true;

                factorioProcess.OutputDataReceived += FactorioProcess_OutputDataReceived;

                factorioProcess.ErrorDataReceived += (s, e) =>
                {
                    if (!string.IsNullOrWhiteSpace(e.Data))
                    {
                        SendFactorioOutputData("[Error] " + e.Data);
                    }
                };

                try
                {
                    factorioProcess.Start();
                }
                catch (Exception e)
                {
                    Log.Error(e, "Error starting factorio process");
                    exit = true;
                    return;
                }

                factorioProcess.BeginOutputReadLine();
                factorioProcess.BeginErrorReadLine();

                factorioProcess.StandardInput.AutoFlush = true;

                await ChangeStatus(FactorioServerStatus.Starting);

                Log.Information("Started factorio process");
            }
            finally
            {
                factorioProcessLock.Release();
            }
        }

        private static async void FactorioProcess_OutputDataReceived(object sender, DataReceivedEventArgs e)
        {
            var data = e.Data;

            if (data == null)
            {
                return;
            }

            if (status != FactorioServerStatus.Running)
            {
                SendFactorioOutputData(data);

                if (status == FactorioServerStatus.Starting)
                {
                    var match = outputRegex.Match(data);
                    if (!match.Success)
                    {
                        return;
                    }

                    string line = match.Groups[1].Value;

                    if (line.StartsWith("Factorio initialised"))
                    {
                        lastUpdateTime = DateTime.UtcNow;
                        string command = BuildCurentTimeCommand(lastUpdateTime);
                        _ = SendToFactorio(command);

                        await ChangeStatus(FactorioServerStatus.Running);
                    }
                }
            }
            else
            {
                var match = outputRegex.Match(data);
                if (!match.Success)
                {
                    SendFactorioOutputData(data);
                    return;
                }

                string line = match.Groups[1].Value;

                if (!line.StartsWith("Warning TransmissionControlHelper.cpp"))
                {
                    SendFactorioOutputData(data);
                }
            }
        }

        private static void SendFactorioOutputData(string data)
        {
            if (!connected)
            {
                return;
            }

            try
            {
                connection.SendAsync(nameof(IFactorioProcessServerMethods.SendFactorioOutputData), data);
            }
            catch (Exception e)
            {
                Log.Error(e, "Error sending factorio output data");
            }

        }

        private static Task SendWrapperData(string data)
        {
            if (!connected)
            {
                return Task.FromResult(0);
            }

            try
            {
                return connection.SendAsync(nameof(IFactorioProcessServerMethods.SendWrapperData), data);
            }
            catch (Exception e)
            {
                Log.Error(e, "Error sending wrapper output data");
            }

            return Task.FromResult(0);
        }

        private static async Task ChangeStatus(FactorioServerStatus newStatus)
        {
            var oldStatus = status;
            if (newStatus != status)
            {
                status = newStatus;
                Log.Information("Factorio status changed from {oldStatus} to {newStatus}", oldStatus, newStatus);
            }
            // Even if the status hasn't changed, still send it to the Server as this method is used to poll the status for reconnected processes.

            if (!connected)
            {
                return;
            }

            try
            {
                Log.Information("Sending Factorio status changed from {oldStatus} to {newStatus}", oldStatus, newStatus);
                await connection.SendAsync(nameof(IFactorioProcessServerMethods.StatusChanged), newStatus, oldStatus);
            }
            catch (Exception e)
            {
                Log.Error(e, "Error sending factorio status data");
            }
        }

        private static async Task<bool> TryConnectAsync(HubConnection hubConnection)
        {
            try
            {
                var cancelToken = new CancellationTokenSource(5000).Token;
                var connectionTask = hubConnection.StartAsync(cancelToken);
                await connectionTask;

                return connectionTask.IsCompletedSuccessfully;
            }
            catch (Exception e)
            {
                Log.Error(e, nameof(TryConnectAsync));
                return false;
            }
        }

        private static async Task Reconnect()
        {
            while (!await TryConnectAsync(connection))
            {
                if (factorioProcess == null)
                {
                    exit = true;
                    return;
                }
                await Task.Delay(1000);
            }
            connected = true;

            await connection.InvokeAsync(nameof(IFactorioProcessServerMethods.RegisterServerId), serverId);

            if (status == FactorioServerStatus.WrapperStarting)
            {
                await ChangeStatus(FactorioServerStatus.WrapperStarted);
            }

            Log.Information("Connected");
        }

        private static string BuildCurentTimeCommand(DateTime now)
        {
            var timeStamp = (int)(now - unixEpoch).TotalSeconds;
            return $"/silent-command local s = ServerCommands s = s and s.set_time({timeStamp})";
        }
    }
}
