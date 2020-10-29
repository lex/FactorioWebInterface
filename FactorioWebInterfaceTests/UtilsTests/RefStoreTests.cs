using FactorioWebInterface.Utils;
using Moq;
using System;
using Xunit;

namespace FactorioWebInterfaceTests.UtilsTests
{
    public sealed class RefStoreTests
    {
        [Fact]
        public void ThrowsWhenCreateWithoutUsage()
        {
            // Arrange.
            var refStore = new RefStore<int, string>();

            int count = 0;
            Func<bool, string> factory = (bool _) => { count++; return ""; };

            // Act + Assert.
            Assert.Throws<InvalidOperationException>(() => refStore.GetValueOrCreate(0, factory));
            Assert.Equal(0, count);
        }

        [Fact]
        public void ThrowsWhenCreate_WhenUsageSetToZero()
        {
            // Arrange.
            const int key = 0;
            var refStore = new RefStore<int, string>();

            int count = 0;
            Func<bool, string> factory = (bool _) => { count++; return ""; };

            refStore.AddUsage(key);
            refStore.RemoveUsage(key);

            // Act + Assert.
            Assert.Throws<InvalidOperationException>(() => refStore.GetValueOrCreate(key, factory));
            Assert.Equal(0, count);
        }

        [Fact]
        public void CanCreate()
        {
            // Arrange.
            const int key = 0;
            const string value = "value";

            var refStore = new RefStore<int, string>();
            refStore.AddUsage(key);

            int count = 0;
            Func<bool, string> factory = (bool _) => { count++; return value; };

            // Act.
            var actual = refStore.GetValueOrCreate(key, factory);

            // Assert.
            Assert.Equal(value, actual);
            Assert.Equal(1, count);
        }

        [Fact]
        public void GetValueOrCreate_ReturnsSameObject_WhenCalledMultipleTimes()
        {
            // Arrange.
            const int key = 0;
            object value = new object();

            var refStore = new RefStore<int, object>();
            refStore.AddUsage(key);

            int count = 0;
            Func<bool, object> factory = (bool _) => { count++; return value; };

            // Act.
            var first = refStore.GetValueOrCreate(key, factory);
            var second = refStore.GetValueOrCreate(key, factory);

            // Assert.
            Assert.Equal(value, first);
            Assert.Equal(value, second);
            Assert.Equal(1, count);
        }

        [Fact]
        public void GetValueOrCreate_ReturnsSameObject_WhenStillHasUsage()
        {
            // Arrange.
            const int key = 0;
            object value = new object();

            var refStore = new RefStore<int, object>();
            refStore.AddUsage(key);

            int count = 0;
            Func<bool, object> factory = (bool _) => { count++; return value; };

            // Act.
            var first = refStore.GetValueOrCreate(key, factory);

            refStore.AddUsage(key);
            refStore.RemoveUsage(key);

            var second = refStore.GetValueOrCreate(key, factory);

            // Assert.
            Assert.Equal(value, first);
            Assert.Equal(value, second);
            Assert.Equal(1, count);
        }

        [Fact]
        public void Disposes_WhenUsageZero()
        {
            // Arrange.
            const int key = 0;
            var valueMock = new Mock<IDisposable>(MockBehavior.Strict);
            valueMock.Setup(x => x.Dispose());
            object value = valueMock.Object;

            var refStore = new RefStore<int, object>();
            refStore.AddUsage(key);

            Func<bool, object> factory = (bool _) => value;
            refStore.GetValueOrCreate(key, factory);

            // Act.
            refStore.RemoveUsage(key);

            // Assert.
            valueMock.Verify(x => x.Dispose(), Times.Once);
        }

        [Fact]
        public void Disposes_OnlyOnce()
        {
            // Arrange.
            const int key = 0;
            var valueMock = new Mock<IDisposable>(MockBehavior.Strict);
            valueMock.Setup(x => x.Dispose());
            object value = valueMock.Object;

            var refStore = new RefStore<int, object>();
            refStore.AddUsage(key);

            Func<bool, object> factory = (bool _) => value;
            refStore.GetValueOrCreate(key, factory);

            // Act.
            refStore.RemoveUsage(key);
            refStore.RemoveUsage(key);

            // Assert.
            valueMock.Verify(x => x.Dispose(), Times.Once);
        }

        [Fact]
        public void CanStoreMultipleValues()
        {
            // Arrange.
            const int firstKey = 1;
            const int secondKey = 2;
            object firstValue = new object();
            object secondValue = new object();

            var refStore = new RefStore<int, object>();
            refStore.AddUsage(firstKey);
            refStore.AddUsage(secondKey);

            Func<object, object> factory = state => state;

            // Act.
            var actualFirst = refStore.GetValueOrCreate(firstKey, factory, firstValue);
            var actualSecond = refStore.GetValueOrCreate(secondKey, factory, secondValue);

            // Assert.
            Assert.Equal(firstValue, actualFirst);
            Assert.Equal(secondValue, actualSecond);
        }
    }
}
