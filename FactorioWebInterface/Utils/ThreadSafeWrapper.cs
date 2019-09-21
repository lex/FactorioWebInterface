using Microsoft.VisualStudio.Web.CodeGeneration.Templating;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace FactorioWebInterface.Utils
{
    public class ThreadSafeWrapper<T>
    {
        protected SemaphoreSlim Semaphore { get; }
        protected T Value { get; }

        public ThreadSafeWrapper(T value, SemaphoreSlim semaphore)
        {
            Semaphore = semaphore;
            Value = value;
        }

        public ThreadSafeWrapper(T value) : this(value, new SemaphoreSlim(1))
        {
        }

        public void Lock(Action<T> callback)
        {
            Semaphore.Wait();

            try
            {
                callback(Value);
            }
            finally
            {
                Semaphore.Release();
            }
        }

        public void Lock(Action<T> callback, CancellationToken cancellationToken)
        {
            Semaphore.Wait(cancellationToken);

            try
            {
                callback(Value);
            }
            finally
            {
                Semaphore.Release();
            }
        }

        public TResult Lock<TResult>(Func<T, TResult> callback)
        {
            Semaphore.Wait();

            try
            {
                return callback(Value);
            }
            finally
            {
                Semaphore.Release();
            }
        }

        public TResult Lock<TResult>(Func<T, TResult> callback, CancellationToken cancellationToken)
        {
            Semaphore.Wait(cancellationToken);

            try
            {
                return callback(Value);
            }
            finally
            {
                Semaphore.Release();
            }
        }

        public async Task LockAsync(Action<T> callback)
        {
            await Semaphore.WaitAsync();

            try
            {
                callback(Value);
            }
            finally
            {
                Semaphore.Release();
            }
        }

        public async Task LockAsync(Action<T> callback, CancellationToken cancellationToken)
        {
            await Semaphore.WaitAsync(cancellationToken);

            try
            {
                callback(Value);
            }
            finally
            {
                Semaphore.Release();
            }
        }

        public async Task<TResult> LockAsync<TResult>(Func<T, TResult> callback)
        {
            await Semaphore.WaitAsync();

            try
            {
                return callback(Value);
            }
            finally
            {
                Semaphore.Release();
            }
        }

        public async Task<TResult> LockAsync<TResult>(Func<T, TResult> callback, CancellationToken cancellationToken)
        {
            await Semaphore.WaitAsync(cancellationToken);

            try
            {
                return callback(Value);
            }
            finally
            {
                Semaphore.Release();
            }
        }

        public async Task LockAsync(Func<T, Task> callback)
        {
            await Semaphore.WaitAsync();

            try
            {
                await callback(Value);
            }
            finally
            {
                Semaphore.Release();
            }
        }

        public async Task LockAsync(Func<T, Task> callback, CancellationToken cancellationToken)
        {
            await Semaphore.WaitAsync(cancellationToken);

            try
            {
                await callback(Value);
            }
            finally
            {
                Semaphore.Release();
            }
        }

        public async Task<TReturn> LockAsync<TReturn>(Func<T, Task<TReturn>> callback)
        {
            await Semaphore.WaitAsync();

            try
            {
                return await callback(Value);
            }
            finally
            {
                Semaphore.Release();
            }
        }

        public async Task<TReturn> LockAsync<TReturn>(Func<T, Task<TReturn>> callback, CancellationToken cancellationToken)
        {
            await Semaphore.WaitAsync(cancellationToken);

            try
            {
                return await callback(Value);
            }
            finally
            {
                Semaphore.Release();
            }
        }
    }
}
