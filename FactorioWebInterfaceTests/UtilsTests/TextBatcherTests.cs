using FactorioWebInterface.Services.Utils;
using Xunit;

namespace FactorioWebInterfaceTests.UtilsTests
{
    public sealed class TextBatcherTests
    {
        [Theory]
        [InlineData("", new[] { "" })]
        [InlineData("a", new[] { "a" })]
        [InlineData("a\nb", new[] { "a", "b" })]
        [InlineData("a\nb\nc", new[] { "a", "b", "c" })]
        [InlineData("abc\ndef\nghi", new[] { "abc", "def", "ghi" })]
        [InlineData("\n", new[] { "\n" })]
        [InlineData("\n\n\n", new[] { "\n", "\n" })]
        [InlineData("a\n\nb\n", new[] { "a\n", "b\n" })]
        public void MakeBatchWithinCapacityTests(string expected, string[] parts)
        {
            // Arrange.
            var batcher = new TextBatcher(16);

            foreach (var part in parts)
            {
                Assert.True(batcher.TryAdd(part), "Should be space to add parts.");
            }

            // Act + Assert.
            Assert.Equal(expected, batcher.MakeBatch());
        }

        [Theory]
        [InlineData(new[] { "ab", "cd" }, new[] { "ab", "cd" })]
        [InlineData(new[] { "abcd", "ef" }, new[] { "abcd", "ef" })]
        [InlineData(new[] { "ab\nc", "ef" }, new[] { "ab", "c", "ef" })]
        public void MakeBatchOverCapacityTests(string[] expectedBatches, string[] parts)
        {
            // Arrange.
            var batcher = new TextBatcher(4);

            // Act + Assert.
            int batchIndex = 0;
            foreach (var part in parts)
            {
                if (!batcher.TryAdd(part))
                {
                    Assert.Equal(expectedBatches[batchIndex], batcher.MakeBatch());
                    batchIndex++;
                    batcher.TryAdd(part);
                }
            }

            if (batchIndex < expectedBatches.Length)
            {
                Assert.Equal(expectedBatches[expectedBatches.Length - 1], batcher.MakeBatch());
            }
        }

        [Fact]
        public void MakeBatchMakesRoom()
        {
            // Arrange.
            var batcher = new TextBatcher(4);

            Assert.True(batcher.TryAdd("abcd"));
            Assert.False(batcher.TryAdd("a"));
            Assert.Equal("abcd", batcher.MakeBatch());

            // Act.
            var canAdd = batcher.TryAdd("f");

            // Assert.
            Assert.True(canAdd);
            Assert.Equal("f", batcher.MakeBatch());
        }

        [Theory]
        [InlineData(1, "a")]
        [InlineData(2, "ab")]
        [InlineData(4, "abcd")]
        public void CanAddToCapacity(int size, string text)
        {
            // Arrange.
            var batcher = new TextBatcher(size);

            // Act + Assert.
            Assert.True(batcher.TryAdd(text));
            Assert.Equal(text, batcher.MakeBatch());
        }

        [Theory]
        [InlineData(1, "a")]
        [InlineData(2, "ab")]
        [InlineData(4, "abcd")]
        public void TryAdd_ReturnsFalse_WhenFull(int size, string text)
        {
            // Arrange.
            var batcher = new TextBatcher(size);
            Assert.True(batcher.TryAdd(text));

            // Act + Assert.
            Assert.False(batcher.TryAdd("f"));
            Assert.Equal(text, batcher.MakeBatch());
        }

        [Fact]
        public void TryAdd_ReturnsFalse_WhenTextLargerThanCapacity()
        {
            // Arrange.
            var batcher = new TextBatcher(2);

            // Act + Assert.
            Assert.False(batcher.TryAdd("abc"));
            Assert.Equal("", batcher.MakeBatch());
        }
    }
}
