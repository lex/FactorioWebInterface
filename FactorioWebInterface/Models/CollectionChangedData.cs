using System;
using System.Collections.Generic;

namespace FactorioWebInterface.Models
{
    public enum CollectionChangeType
    {
        Reset,
        Remove,
        Add,
        AddAndRemove
    }

    public class CollectionChangedData<T>
    {
        public CollectionChangeType Type { get; set; }
        public IReadOnlyList<T> NewItems { get; set; }
        public IReadOnlyList<T> OldItems { get; set; }

        public CollectionChangedData(CollectionChangeType type, IReadOnlyList<T> newItems, IReadOnlyList<T> oldItems = null)
        {
            Type = type;
            NewItems = newItems ?? Array.Empty<T>();
            OldItems = oldItems ?? Array.Empty<T>();
        }
    }
    public static class CollectionChangedData
    {
        public static CollectionChangedData<T> Reset<T>(IReadOnlyList<T> items)
        {
            return new CollectionChangedData<T>(CollectionChangeType.Reset, items);
        }

        public static CollectionChangedData<T> Remove<T>(IReadOnlyList<T> items)
        {
            return new CollectionChangedData<T>(CollectionChangeType.Remove, null, items);
        }

        public static CollectionChangedData<T> Add<T>(IReadOnlyList<T> items)
        {
            return new CollectionChangedData<T>(CollectionChangeType.Add, items);
        }

        public static CollectionChangedData<T> AddAndRemove<T>(IReadOnlyList<T> newItems, IReadOnlyList<T> oldItems)
        {
            return new CollectionChangedData<T>(CollectionChangeType.AddAndRemove, newItems, oldItems);
        }
    }

    public class KeyValueCollectionChangedData<K, V>
    {
        private static readonly IReadOnlyDictionary<K, V> empty = new Dictionary<K, V>(0);
        public CollectionChangeType Type { get; set; }
        public IReadOnlyDictionary<K, V> NewItems { get; set; }
        public IReadOnlyDictionary<K, V> OldItems { get; set; }

        public KeyValueCollectionChangedData(CollectionChangeType type, IReadOnlyDictionary<K, V> newItems, IReadOnlyDictionary<K, V> oldItems = null)
        {
            Type = type;
            NewItems = newItems ?? empty;
            OldItems = oldItems ?? empty;
        }
    }

    public static class KeyValueCollectionChangedData
    {
        public static KeyValueCollectionChangedData<K, V> Reset<K, V>(IReadOnlyDictionary<K, V> items)
        {
            return new KeyValueCollectionChangedData<K, V>(CollectionChangeType.Reset, items);
        }

        public static KeyValueCollectionChangedData<K, V> Remove<K, V>(IReadOnlyDictionary<K, V> items)
        {
            return new KeyValueCollectionChangedData<K, V>(CollectionChangeType.Remove, null, items);
        }

        public static KeyValueCollectionChangedData<K, V> Add<K, V>(IReadOnlyDictionary<K, V> items)
        {
            return new KeyValueCollectionChangedData<K, V>(CollectionChangeType.Add, items);
        }

        public static KeyValueCollectionChangedData<K, V> AddAndRemove<K, V>(IReadOnlyDictionary<K, V> newItems, IReadOnlyDictionary<K, V> oldItems)
        {
            return new KeyValueCollectionChangedData<K, V>(CollectionChangeType.AddAndRemove, newItems, oldItems);
        }
    }
}
