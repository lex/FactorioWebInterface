using FactorioWebInterface.Utils;
using System;
using System.Linq;
using Xunit;

namespace FactorioWebInterfaceTests.UtilsTests
{
    public class CircularBufferTests
    {
        [Fact]
        public void ConstructWithCapacity()
        {
            const int capactiy = 4;

            var cb = new CircularBuffer<int>(capactiy);

            Assert.Equal(capactiy, cb.Capacity);
#pragma warning disable xUnit2013 // Do not use equality check to check for collection size.
            // Needs to be Count as we are testing the property is correct.
            Assert.Equal(0, cb.Count);
#pragma warning restore xUnit2013 // Do not use equality check to check for collection size.
            Assert.Empty(cb.ToArray());
            Assert.Empty(cb);
        }

        [Fact]
        public void ConstructWithInvalidCapacityThrows()
        {
            Assert.Throws<ArgumentException>(() => new CircularBuffer<int>(-1));
            Assert.Throws<ArgumentException>(() => new CircularBuffer<int>(0));
        }

        [Theory]
        [InlineData(new int[0])]
        [InlineData(new[] { 1, 2 })]
        [InlineData(new[] { 1, 2, 3, 4 })]
        public void AddWithinCapacity(int[] items)
        {
            var cb = new CircularBuffer<int>(4);

            foreach (var item in items)
            {
                cb.Add(item);
            }

            Assert.Equal(items.Length, cb.Count);
            Assert.True(Enumerable.SequenceEqual(items, cb.ToArray()));
            Assert.True(Enumerable.SequenceEqual(items, cb));
        }

        [Theory]
        [InlineData(new[] { 1, 2, 3, 4, 5 }, new[] { 2, 3, 4, 5 })]
        [InlineData(new[] { 1, 2, 3, 4, 5, 6, 7, 8 }, new[] { 5, 6, 7, 8 })]
        [InlineData(new[] { 1, 2, 3, 4, 5, 6, 7, 8, 9 }, new[] { 6, 7, 8, 9 })]
        public void AddOverCapacity(int[] items, int[] expected)
        {
            const int capactiy = 4;

            var cb = new CircularBuffer<int>(capactiy);

            foreach (var item in items)
            {
                cb.Add(item);
            }

            Assert.Equal(capactiy, cb.Count);
            Assert.True(Enumerable.SequenceEqual(expected, cb.ToArray()));
            Assert.True(Enumerable.SequenceEqual(expected, cb));
        }
    }
}
