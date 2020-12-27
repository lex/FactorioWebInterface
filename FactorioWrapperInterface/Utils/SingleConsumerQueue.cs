using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Shared.Utils
{
    public sealed class SingleConsumerQueue<T> : IDisposable
    {
        private Queue<T> queue = new Queue<T>();
        private bool disposed = false;
        private TaskCompletionSource<T> taskCompletionSource;

        private readonly Func<T, Task> consumer;
        private readonly int maxSize;

        public SingleConsumerQueue(int maxSize, Func<T, Task> consumer)
        {
            this.consumer = consumer;
            this.maxSize = maxSize;

            taskCompletionSource = new TaskCompletionSource<T>();
            var task = taskCompletionSource.Task;

            async Task consumerRunner()
            {
                try
                {
                    var item = await task;
                    await consumer(item);
                }
                catch (OperationCanceledException)
                {
                    lock (queue)
                    {
                        if (disposed)
                            return;
                    }
                }
                catch
                {
                }

                while (true)
                {
                    try
                    {
                        var item = await DequeueAsync();
                        await consumer(item);
                    }
                    catch (OperationCanceledException)
                    {
                        lock (queue)
                        {
                            if (disposed)
                                return;
                        }
                    }
                    catch
                    {
                    }
                }
            }

            _ = Task.Run(consumerRunner);
        }

        public SingleConsumerQueue(Func<T, Task> consumer) : this(int.MaxValue, consumer)
        {
        }

        public void Enqueue(T item)
        {
            lock (queue)
            {
                if (disposed)
                {
                    return;
                }

                if (queue.Count >= maxSize)
                {
                    return;
                }

                if (taskCompletionSource != null)
                {
                    var tcs = taskCompletionSource;
                    taskCompletionSource = null;
                    tcs.SetResult(item);
                }
                else
                {
                    queue.Enqueue(item);
                }
            }
        }

        public int Count
        {
            get
            {
                lock (queue)
                {
                    return queue.Count + (taskCompletionSource == null ? 0 : 1);
                }
            }
        }

        public bool IsEmpty
        {
            get
            {
                lock (queue)
                {
                    return queue.Count == 0 && taskCompletionSource != null;
                }
            }
        }

        private Task<T> DequeueAsync()
        {
            lock (queue)
            {
                if (disposed)
                {
                    return Task.FromException<T>(new OperationCanceledException());
                }

                if (queue.TryDequeue(out T item))
                {
                    return Task.FromResult(item);
                }

                taskCompletionSource = new TaskCompletionSource<T>();
                return taskCompletionSource.Task;
            }
        }

        /// <summary>
        /// Returns false if task was canceled.
        /// </summary>
        /// <param name="cancellationToken"></param>
        /// <returns>False if canceled</returns>
        public async Task<bool> WaitForEmpty(CancellationToken cancellationToken = default)
        {
            while (true)
            {
                if (cancellationToken.IsCancellationRequested)
                {
                    return false;
                }

                if (IsEmpty)
                {
                    return true;
                }

                await Task.Delay(16);
            }
        }

        /// <summary>
        /// Returns false if task was canceled.
        /// </summary>
        /// <param name="cancellationToken"></param>
        /// <returns>False if canceled</returns>
        public async Task<bool> WaitForEmpty(TimeSpan timeout)
        {
            using (var cts = new CancellationTokenSource(timeout))
            {
                return await WaitForEmpty(cts.Token);
            }
        }

        public void Dispose()
        {
            lock (queue)
            {
                if (disposed)
                {
                    return;
                }

                disposed = true;

                taskCompletionSource?.TrySetCanceled();
            }
        }
    }
}
