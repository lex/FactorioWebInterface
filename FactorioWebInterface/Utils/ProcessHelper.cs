using Serilog;
using System;
using System.Diagnostics;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FactorioWebInterface.Utils
{
    public class ProcessResult
    {
        public ProcessResult(int exitCode, string output, string error)
        {
            ExitCode = exitCode;
            Output = output;
            Error = error;
        }

        public int ExitCode { get; }
        public string Output { get; }
        public string Error { get; }
    }

    public static class ProcessHelper
    {
        /// <summary>
        /// Runs a process until it ends. Returns true if successful.
        /// </summary>
        /// <param name="fileName"></param>
        /// <param name="arguments"></param>        
        /// <param name="timeout">-1 for no timeout.</param>     
        public static bool RunProcessToEnd(string fileName, string arguments = null, int timeout = -1)
        {
            Log.Logger.Information("RunProcessToEnd filename: {fileName} arguments: {arguments}", fileName, arguments);

            var process = new Process
            {
                StartInfo =
                {
                    FileName = fileName, Arguments = arguments,
                    UseShellExecute = false, CreateNoWindow = true,
                }
            };

            try
            {
                process.Start();
                process.WaitForExit(timeout);

                if (process.HasExited)
                {
                    return process.ExitCode == 0;
                }
                else
                {
                    process.Kill();
                    Log.Logger.Information("RunProcessToEnd Cancelled filename: {fileName} arguments: {arguments}", fileName, arguments);
                    return false;
                }
            }
            catch (Exception e)
            {
                Log.Logger.Error(e, "RunProcessToEnd filename: {fileName} arguments: {arguments}", fileName, arguments);
                return false;
            }
            finally
            {
                process.Dispose();
            }
        }

        /// <summary>
        /// Runs a process until it ends and reads all StdOut and StdErr.
        /// </summary>
        /// <param name="fileName"></param>
        /// <param name="arguments"></param>        
        /// <param name="timeout">-1 for no timeout.</param>     
        public static ProcessResult RunProcessReadAll(string fileName, string arguments = null, int timeout = -1)
        {
            Log.Logger.Information("RunProcessReadAll filename: {fileName} arguments: {arguments}", fileName, arguments);

            var process = new Process
            {
                StartInfo =
                {
                    FileName = fileName, Arguments = arguments,
                    UseShellExecute = false, CreateNoWindow = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true
                }
            };

            var output = new StringBuilder();
            var error = new StringBuilder();

            process.OutputDataReceived += (_, e) => output.Append(e.Data);
            process.ErrorDataReceived += (_, e) => error.Append(e.Data);

            try
            {
                process.Start();

                process.BeginOutputReadLine();
                process.BeginErrorReadLine();

                process.WaitForExit(timeout);

                if (!process.HasExited)
                {
                    process.Kill();
                    Log.Logger.Information("RunProcessReadAll Cancelled filename: {fileName} arguments: {arguments}", fileName, arguments);
                }

                return new ProcessResult(process.ExitCode, output.ToString(), error.ToString());
            }
            catch (Exception e)
            {
                Log.Logger.Error(e, "RunProcessReadAll filename: {fileName} arguments: {arguments}", fileName, arguments);
                return new ProcessResult(-1, output.ToString(), error.ToString());
            }
            finally
            {
                process.Dispose();
            }
        }

        /// <summary>
        /// Asynchronous runs a process until it ends. Returns true if successful.
        /// </summary>
        /// <param name="fileName"></param>
        /// <param name="arguments"></param> 
        public static Task<bool> RunProcessToEndAsync(string fileName, string arguments = null)
        {
            Log.Logger.Information("RunProcessToEndAsync filename: {fileName} arguments: {arguments}", fileName, arguments);

            var process = new Process
            {
                StartInfo =
                {
                    FileName = fileName, Arguments = arguments,
                    UseShellExecute = false, CreateNoWindow = true,
                },
                EnableRaisingEvents = true
            };

            var tcs = new TaskCompletionSource<bool>();

            process.Exited += (sender, args) =>
            {
                tcs.TrySetResult(process.ExitCode == 0);
                process.Dispose();
            };

            try
            {
                process.Start();
            }
            catch (Exception e)
            {
                Log.Logger.Error(e, "RunProcessToEndAsync filename: {fileName} arguments: {arguments}", fileName, arguments);
                tcs.TrySetResult(false);
                process.Dispose();
            }

            return tcs.Task;
        }

        /// <summary>
        /// Asynchronous runs a process until it ends. Returns true if successful.
        /// </summary>
        /// <param name="fileName"></param>
        /// <param name="arguments"></param> 
        /// <param name="cancellationToken"></param> 
        public static Task<bool> RunProcessToEndAsync(string fileName, string arguments = null, CancellationToken cancellationToken = default)
        {
            Log.Logger.Information("RunProcessToEndAsync filename: {fileName} arguments: {arguments}", fileName, arguments);

            if (cancellationToken.IsCancellationRequested)
            {
                Log.Logger.Information("RunProcessToEndAsync Cancelled before start filename: {fileName} arguments: {arguments}", fileName, arguments);
                return Task.FromResult(false);
            }

            var process = new Process
            {
                StartInfo =
                {
                    FileName = fileName, Arguments = arguments,
                    UseShellExecute = false, CreateNoWindow = true,
                },
                EnableRaisingEvents = true
            };

            var tcs = new TaskCompletionSource<bool>();

            CancellationTokenRegistration registration = default;
            registration = cancellationToken.Register(() =>
            {
                try
                {
                    tcs.TrySetResult(false);
                    process.Kill();
                }
                catch
                {
                }
                finally
                {
                    Log.Logger.Information("RunProcessToEndAsync Cancelled filename: {fileName} arguments: {arguments}", fileName, arguments);
                    process.Dispose();
                    registration.Dispose();
                }
            });

            process.Exited += (sender, args) =>
            {
                tcs.TrySetResult(process.ExitCode == 0);
                process.Dispose();
                registration.Dispose();
            };

            try
            {
                process.Start();
            }
            catch (Exception e)
            {
                Log.Logger.Error(e, "RunProcessToEndAsync filename: {fileName} arguments: {arguments}", fileName, arguments);
                tcs.TrySetResult(false);
                process.Dispose();
                registration.Dispose();
            }

            return tcs.Task;
        }
        /// <summary>
        /// Asynchronous runs a process until it ends. Returns true if successful.
        /// </summary>
        /// <param name="fileName"></param>
        /// <param name="arguments"></param> 
        /// <param name="timeout"></param> 
        public static async Task<bool> RunProcessToEndAsync(string fileName, string arguments = null, TimeSpan timeout = default)
        {
            using (var cts = new CancellationTokenSource(timeout))
            {
                return await RunProcessToEndAsync(fileName, arguments, cts.Token);
            }
        }
    }
}

