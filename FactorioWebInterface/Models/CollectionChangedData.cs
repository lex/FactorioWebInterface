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
            NewItems = newItems;
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
            return new CollectionChangedData<T>(CollectionChangeType.Remove, Array.Empty<T>(), items);
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
}
