using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using RconSharp;
using Serilog;
using Shared;
using Shared.Utils;
using System;
using System.Diagnostics;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

namespace FactorioWrapper
{
    public class MainLoop : IDisposable
    {
        private const int maxMessageQueueSize = 10_000;

        private static Regex outputRegex = new Regex(@"\d+\.\d+ (.+)", RegexOptions.Compiled);

        private static TimeSpan updateTimeInterval = TimeSpan.FromMinutes(1);
        private static readonly DateTime unixEpoch = new DateTime(1970, 1, 1);

        private readonly Settings settings;
        private readonly string serverId;
        private readonly string factorioFileName;

#if WINDOWS
        private string factorioArguments;
#else
        private readonly string factorioArguments;
#endif

        // This is to stop multiple threads writing to the factorio process concurrently.
        private readonly SemaphoreSlim factorioProcessLock = new SemaphoreSlim(1, 1);

        private volatile bool exit = false;
        private DateTime lastUpdateTime;
        private volatile HubConnection connection;

        private volatile CancellationTokenSource exitClearMessageQueueCancelSource;

        // This is to allow prioritising status messages vs other messages.
        private volatile bool canSendMessages = false;

        private volatile Process factorioProcess;
        private volatile FactorioServerStatus status = FactorioServerStatus.WrapperStarting;
        private readonly SingleConsumerQueue<Func<Task>> messageQueue;

#if WINDOWS
        private volatile RconMessenger rcon;
        private int rconPort;
        private const string rconPassword = "no_one_will_guess_this_awesome_password.";

        private void PrependRconArguments()
        {
            int index = factorioArguments.IndexOf("--port");

            int start = index + 7;
            int end = factorioArguments.IndexOf(' ', start);
            if (end == -1)
            {
                end = factorioArguments.Length;
            }

            string port = factorioArguments.Substring(start, end - start);

            int.TryParse(port, out rconPort);

            factorioArguments += $" --rcon-port {rconPort} --rcon-password {rconPassword}";
        }

        private async Task ConnectRCON()
        {
            try
            {
                await factorioProcessLock.WaitAsync();

                rcon = new RconMessenger();
                bool isConnected = await rcon.ConnectAsync("127.0.0.1", rconPort);
                bool authenticated = await rcon.AuthenticateAsync(rconPassword);
            }
            finally
            {
                factorioProcessLock.Release();
            }
        }
#endif

        public MainLoop(Settings settings, string serverId, string factorioFileName, string factorioArguments)
        {
            this.settings = settings;
            this.serverId = serverId;
            this.factorioFileName = factorioFileName;
            this.factorioArguments = factorioArguments;

#if WINDOWS
            PrependRconArguments();
#endif

            messageQueue = new SingleConsumerQueue<Func<Task>>(maxMessageQueueSize, async func =>
            {
                int retry = 10;
                while (true)
                {
                    if (!canSendMessages)
                    {
                        await Task.Delay(100);
                        continue;
                    }

                    try
                    {
                        await func();
                        return;
                    }
                    catch (Exception e)
                    {
                        Log.Error(e, "Error messageQueue");
                        retry--;

                        if (retry == 0)
                        {
                            return;
                        }
                    }
                }
            });
        }

        public void Run()
        {
            RunInner().GetAwaiter().GetResult();
        }

        private async Task RunInner()
        {
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

            // Sometimes when factorio crashes the process isn't shutdown correctly, so we kill it to be sure.
            if (status.HasFinishedRunning())
            {
                var processes = Process.GetProcessesByName("factorio");
                foreach (var process in processes)
                {
                    try
                    {
                        if (process.MainModule.FileName.EndsWith(factorioFileName))
                        {
                            process.Kill(entireProcessTree: true);
                        }
                    }
                    catch (Exception e)
                    {
                        Log.Warning(e, "Kill processes on crash.");
                    }
                }
            }

            SendWrapperData("Exiting wrapper");

            if (exitClearMessageQueueCancelSource == null)
            {
                exitClearMessageQueueCancelSource = new CancellationTokenSource();
            }

            await messageQueue.WaitForEmpty(exitClearMessageQueueCancelSource.Token);

            switch (status)
            {
                case FactorioServerStatus.Stopping:
                    await ChangeStatus(FactorioServerStatus.Stopped);
                    break;
                case FactorioServerStatus.Killing:
                    await ChangeStatus(FactorioServerStatus.Killed);
                    break;
                case FactorioServerStatus.WrapperStarting:
                    // Todo change this to Errored.
                    await ChangeStatus(FactorioServerStatus.Crashed);
                    break;
                case FactorioServerStatus.WrapperStarted:
                case FactorioServerStatus.Starting:
                case FactorioServerStatus.Running:
                    await ChangeStatus(FactorioServerStatus.Crashed);
                    break;
                default:
                    Log.Error("Previous status {status} was unexpected when exiting wrapper.", status);
                    break;
            }
        }

        private async Task RestartWrapperAsync()
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

        private async Task SendToFactorio(string data)
        {
            try
            {
                await factorioProcessLock.WaitAsync();

                var p = factorioProcess;
                if (p != null && !p.HasExited)
                {
#if WINDOWS
                    rcon?.ExecuteCommandAsync(data);
#else
                    await p.StandardInput.WriteLineAsync(data);
#endif
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

        private void BuildConenction()
        {
            Log.Information("Building connection");

            connection = new HubConnectionBuilder()
                .WithUrl(settings.Url, options =>
                {
                    options.AccessTokenProvider = () => Task.FromResult(settings.Token);
                })
                .AddMessagePackProtocol()
                .Build();

            connection.Closed += async (error) =>
            {
                canSendMessages = false;

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
                    exitClearMessageQueueCancelSource?.Cancel();
                    exitClearMessageQueueCancelSource = new CancellationTokenSource(TimeSpan.FromSeconds(30));

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
                    SendWrapperData("Error stopping factorio process");
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
                    exitClearMessageQueueCancelSource?.Cancel();
                    exitClearMessageQueueCancelSource = new CancellationTokenSource(TimeSpan.FromSeconds(5));

                    await factorioProcessLock.WaitAsync(1000);

                    Log.Information("Killing factorio server.");

                    var p = factorioProcess;
                    if (p != null && !p.HasExited)
                    {
                        p.Kill(entireProcessTree: true);
                    }

                    await ChangeStatus(FactorioServerStatus.Killing);
                }
                catch (Exception e)
                {
                    Log.Error(e, "Error force killing factorio process");
                    SendWrapperData("Error killing factorio process");
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

        private async Task StartFactorioProcess()
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



        private async void FactorioProcess_OutputDataReceived(object sender, DataReceivedEventArgs e)
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
#if WINDOWS
                    if (line == "Info UDPSocket.cpp:39: Opening socket for broadcast")
                    {
                        await ConnectRCON();

                        lastUpdateTime = DateTime.UtcNow;
                        string command = BuildCurentTimeCommand(lastUpdateTime);
                        _ = SendToFactorio(command);

                        await ChangeStatus(FactorioServerStatus.Running);
                    }
#else
                    if (line.StartsWith("Factorio initialised"))
                    {
                        lastUpdateTime = DateTime.UtcNow;
                        string command = BuildCurentTimeCommand(lastUpdateTime);
                        _ = SendToFactorio(command);

                        await ChangeStatus(FactorioServerStatus.Running);
                    }
#endif
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

        private void SendFactorioOutputData(string data)
        {
            DateTime now = DateTime.UtcNow;
            messageQueue.Enqueue(async () => await connection.InvokeAsync(nameof(IFactorioProcessServerMethods.SendFactorioOutputDataWithDateTime), data, now));
        }

        private void SendWrapperData(string data)
        {
            DateTime now = DateTime.UtcNow;
            messageQueue.Enqueue(async () => await connection.InvokeAsync(nameof(IFactorioProcessServerMethods.SendWrapperDataWithDateTime), data, now));
        }

        private async Task<bool> ChangeStatus(FactorioServerStatus newStatus)
        {
            canSendMessages = false;

            var oldStatus = status;
            if (newStatus != status)
            {
                status = newStatus;
                Log.Information("Factorio status changed from {oldStatus} to {newStatus}", oldStatus, newStatus);
            }

            // Even if the status hasn't changed, still send it to the Server as this method is used to poll the status for reconnected processes.

            bool success = await SendStatus(newStatus, oldStatus);

            canSendMessages = true;

            return success;
        }

        private async Task<bool> SendStatus(FactorioServerStatus newStatus, FactorioServerStatus oldStatus)
        {
            try
            {
                Log.Information("Sending Factorio status changed from {oldStatus} to {newStatus}", oldStatus, newStatus);

                var now = DateTime.UtcNow;
                await connection.InvokeAsync(nameof(IFactorioProcessServerMethods.StatusChangedWithDateTime), newStatus, oldStatus, now);

                return true;
            }
            catch (Exception e)
            {
                Log.Error(e, "Error sending factorio status data");
                return false;
            }
        }

        private async Task<bool> SendRegister()
        {
            try
            {
                var now = DateTime.UtcNow;
                await connection.InvokeAsync(nameof(IFactorioProcessServerMethods.RegisterServerIdWithDateTime), serverId, now);

                return true;
            }
            catch (Exception e)
            {
                Log.Error(e, nameof(SendRegister));
                return false;
            }
        }

        private async Task<bool> TryConnectAsync(HubConnection hubConnection)
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

        private async Task Reconnect()
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

            Log.Information("Connected");

            bool success = await SendRegister();

            if (status == FactorioServerStatus.WrapperStarting)
            {
                success &= await ChangeStatus(FactorioServerStatus.WrapperStarted);
            }
            else
            {
                success &= await SendStatus(status, status);
                canSendMessages = true;
            }

            if (success)
            {
                Log.Information("Sent connection data");
            }
            else
            {
                Log.Information("Failed to send connection data");
            }
        }

        private static string BuildCurentTimeCommand(DateTime now)
        {
            var timeStamp = (int)(now - unixEpoch).TotalSeconds;
            return $"/silent-command local s = ServerCommands s = s and s.set_time({timeStamp})";
        }

        private bool disposed = false;
        public void Dispose()
        {
            if (disposed)
            {
                return;
            }

            disposed = true;

            connection?.DisposeAsync();
            messageQueue.Dispose();
            factorioProcess?.Dispose();
        }
    }
}
