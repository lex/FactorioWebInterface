using FactorioWebInterface.Models;
using FactorioWebInterface.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;

namespace FactorioWebInterface.Hubs
{
    [Authorize]
    public class PlaguesPlaygroundHub : Hub<IPlaguesPlaygroundClientMethods>
    {
        public Process RunProcess(string fileName, string arguments, IPlaguesPlaygroundClientMethods client)
        {
            var process = new Process
            {
                StartInfo =
                {
                    FileName = fileName, Arguments = arguments,
                    UseShellExecute = false, CreateNoWindow = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                },
                EnableRaisingEvents = true
            };

            void send(object _, DataReceivedEventArgs e) => client.Send(e.Data);
            process.OutputDataReceived += send;
            process.ErrorDataReceived += send;

            process.Exited += (_, __) =>
            {
                client.Send($"Process exited with code: {process.ExitCode}");
                process.Dispose();
            };

            process.Start();

            process.BeginOutputReadLine();
            process.BeginErrorReadLine();

            Task.Run(async () =>
            {
                await Task.Delay(TimeSpan.FromSeconds(300));
                try
                {
                    if (!process.HasExited)
                    {
                        _ = client.Send("Process timed out, killing");
                        process.Kill();
                        process.Dispose();
                    }
                }
                catch
                {
                }
            });

            return process;
        }

        public Task Start(string filePath, string arguments)
        {
            if (Context.TryGetData<Process>(out var p) && p != null)
            {
                try
                {
                    if (!p.HasExited)
                    {
                        Clients.Caller.Send("Process already running");
                        return Task.FromResult(0);
                    }
                }
                catch
                {
                }

                Context.RemoveData<Process>();
            }

            try
            {
                if (!File.Exists(filePath))
                {
                    Clients.Caller.Send("File not found");
                    return Task.FromResult(0);
                }

                Clients.Caller.Send("Start process");
                Clients.Caller.Send($"FilePath: {filePath} Arguments: {arguments}");
                var process = RunProcess(filePath, arguments, Clients.Caller);

                Context.SetData(process);
            }
            catch (Exception e)
            {
                Clients.Caller.Send(e.ToString());
            }

            return Task.FromResult(0);
        }

        public async Task Kill()
        {
            var process = Context.GetDataOrDefault<Process>();

            try
            {
                if (process != null && !process.HasExited)
                {
                    process.Kill();
                    await Clients.Caller.Send("Process kill");

                    return;
                }
            }
            catch
            {
            }

            await Clients.Caller.Send("No running process");
        }
    }
}
