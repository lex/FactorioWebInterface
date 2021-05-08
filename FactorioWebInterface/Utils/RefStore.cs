using System;
using System.Collections.Generic;

namespace FactorioWebInterface.Utils
{
    public sealed class RefStore<TKey, TValue> where TKey : notnull where TValue : class
    {
        private readonly Dictionary<TKey, (int, TValue)> store = new Dictionary<TKey, (int, TValue)>();

        public void AddUsage(TKey key)
        {
            store.TryGetValue(key, out (int count, TValue value) entry);
            entry.count++;
            store[key] = entry;
        }

        public void RemoveUsage(TKey key)
        {
            if (!store.TryGetValue(key, out (int count, TValue value) entry))
            {
                return;
            }

            if (entry.count > 1)
            {
                entry.count--;
                store[key] = entry;
                return;
            }

            store.Remove(key);
            (entry.value as IDisposable)?.Dispose();
        }

        public TValue GetValueOrCreate<TState>(TKey key, Func<TState?, TValue> factory, TState? state = default)
        {
            if (!store.TryGetValue(key, out (int count, TValue value) entry))
            {
                throw new InvalidOperationException($"Can not call {nameof(GetValueOrCreate)} when key: {key} has no usage.");
            }

            if (entry.value is null)
            {
                entry.value = factory(state);
                store[key] = entry;
            }

            return entry.value;
        }
    }
}
