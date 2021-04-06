using FactorioWebInterface.Models;
using Microsoft.Extensions.Logging;
using System;
using System.Runtime.CompilerServices;
using System.Threading;
using System.Threading.Tasks;

namespace FactorioWebInterface.Utils
{
    //https://github.com/davidfowl/AspNetCoreDiagnosticScenarios/blob/master/AsyncGuidance.md
    public static class TaskExtensions
    {
        public static async Task TimeoutAfter(this Task task, TimeSpan timeout)
        {
            using (var cts = new CancellationTokenSource())
            {
                var delayTask = Task.Delay(timeout, cts.Token);

                var resultTask = await Task.WhenAny(task, delayTask);
                if (resultTask == delayTask)
                {
                    // Operation cancelled
                    throw new OperationCanceledException();
                }
                else
                {
                    // Cancel the timer task so that it does not fire
                    cts.Cancel();
                }

                await task;
            }
        }

        public static Task TimeoutAfter(this Task task, int timeoutInMilliseconds)
            => task.TimeoutAfter(TimeSpan.FromMilliseconds(timeoutInMilliseconds));

        public static async Task<T> TimeoutAfter<T>(this Task<T> task, TimeSpan timeout)
        {
            using (var cts = new CancellationTokenSource())
            {
                var delayTask = Task.Delay(timeout, cts.Token);

                var resultTask = await Task.WhenAny(task, delayTask);
                if (resultTask == delayTask)
                {
                    // Operation cancelled
                    throw new OperationCanceledException();
                }
                else
                {
                    // Cancel the timer task so that it does not fire
                    cts.Cancel();
                }

                return await task;
            }
        }

        public static Task<T> TimeoutAfter<T>(this Task<T> task, int timeoutInMilliseconds)
            => task.TimeoutAfter(TimeSpan.FromMilliseconds(timeoutInMilliseconds));

        public static async Task WithCancellation(this Task task, CancellationToken cancellationToken)
        {
            var tcs = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);

            // This disposes the registration as soon as one of the tasks trigger
            using (cancellationToken.Register(state => ((TaskCompletionSource<bool>)state!).TrySetResult(true), tcs))
            {
                var resultTask = await Task.WhenAny(task, tcs.Task);
                if (resultTask == tcs.Task)
                {
                    // Operation cancelled
                    throw new OperationCanceledException(cancellationToken);
                }

                await task;
            }
        }

        public static async Task<T> WithCancellation<T>(this Task<T> task, CancellationToken cancellationToken)
        {
            var tcs = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);

            // This disposes the registration as soon as one of the tasks trigger
            using (cancellationToken.Register(state => ((TaskCompletionSource<bool>)state!).TrySetResult(true), tcs))
            {
                var resultTask = await Task.WhenAny(task, tcs.Task);
                if (resultTask == tcs.Task)
                {
                    // Operation cancelled
                    throw new OperationCanceledException(cancellationToken);
                }

                return await task;
            }
        }

        public static async Task LogExceptions(this Task task, ILogger logger, [CallerMemberName] string name = "")
        {
            try
            {
                await task;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, name);
            }
        }

        public static async Task LogErrors(this Task<Result> task, ILogger logger, [CallerMemberName] string name = "")
        {
            Result result = await task;
            if (!result.Success)
            {
                logger.LogError("{name}: {Errors}", name, result.Errors);
            }
        }

        public static Task LogErrorsAndExceptions(this Task<Result> task, ILogger logger, [CallerMemberName] string name = "")
        {
            return task.LogErrors(logger, name)
                       .LogExceptions(logger, name);
        }
    }
}
