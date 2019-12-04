using System;
using System.Collections;
using System.Collections.Generic;

namespace FactorioWebInterface.Utils
{
    public class CircularBuffer<T> : IReadOnlyCollection<T>
    {
        private const int defaultCapacity = 4;

        private int head;
        private bool full;
        private T[] array;

        public int Capacity { get; }
        public int Count => full ? Capacity : head;

        public CircularBuffer(int capacity = defaultCapacity)
        {
            if (capacity <= 0)
            {
                throw new ArgumentException($"{nameof(capacity)} must be greater than 0.");
            }

            Capacity = capacity;
            array = new T[Capacity];
        }

        public CircularBuffer(int capacity, IEnumerable<T> items) : this(capacity)
        {
            foreach (var item in items)
            {
                Add(item);
            }
        }

        public void Add(T item)
        {
            array[head] = item;

            head++;
            if (head == Capacity)
            {
                head = 0;
                full = true;
            }
        }

        public void Clear()
        {
            Array.Clear(array, 0, Count);
            head = 0;
            full = false;
        }

        public T[] ToArray()
        {
            if (full)
            {
                T[] copy = new T[Capacity];
                Array.Copy(array, head, copy, 0, Capacity - head);
                Array.Copy(array, 0, copy, Capacity - head, head);
                return copy;
            }
            else
            {
                T[] copy = new T[head];
                Array.Copy(array, 0, copy, 0, head);
                return copy;
            }
        }

        public IEnumerator<T> GetEnumerator()
        {
            if (full)
            {
                for (int i = head; i < array.Length; i++)
                {
                    yield return array[i];
                }
            }

            for (int i = 0; i < head; i++)
            {
                yield return array[i];
            }
        }

        IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
    }
}
