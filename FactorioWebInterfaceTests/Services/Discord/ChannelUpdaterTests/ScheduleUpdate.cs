using Discord;
using FactorioWebInterface.Services;
using FactorioWebInterface.Services.Discord;
using FactorioWebInterface.Utils;
using FactorioWebInterfaceTests.Utils;
using Microsoft.Extensions.Logging;
using Moq;
using Nito.AsyncEx;
using System;
using System.Threading.Tasks;
using Xunit;

namespace FactorioWebInterfaceTests.Services.Discord.ChannelUpdaterTests
{
    public class ScheduleUpdate
    {
        [Fact]
        public async Task DoesModifyChannel()
        {
            // Arrange.
            string? name = null;
            string? topic = null;

            var sent = new TaskCompletionSource<Unit>();

            var channelUpdater = MakeChannelUpdater((n, t) =>
            {
                name = n;
                topic = t;
                sent.SetResult(default);
            });

            // Act.
            channelUpdater.ScheduleUpdate();
            await sent.Task.TimeoutAfter(1000);

            // Assert.
            Assert.NotNull(name);
            Assert.NotNull(topic);
        }

        [Fact]
        public async Task AfterModify_WaitsBeforeNextModify()
        {
            // Arrange.
            var timeoutEvent = new AsyncManualResetEvent();
            var modifyEvent = new AsyncManualResetEvent();

            var timeSystemMock = new Mock<ITimeSystem>(MockBehavior.Strict);
            timeSystemMock.Setup(x => x.Delay(It.IsAny<TimeSpan>())).Returns((TimeSpan _) => timeoutEvent.WaitAsyncWithTimeout(5000));

            string? name = null;
            string? topic = null;

            var channelUpdater = MakeChannelUpdater((n, t) =>
            {
                name = n;
                topic = t;
                modifyEvent.Set();
            },
            timeSystem: timeSystemMock.Object);

            // Act.
            channelUpdater.ScheduleUpdate();
            await modifyEvent.WaitAsyncWithTimeout(5000);

            modifyEvent.Reset();
            channelUpdater.ScheduleUpdate();

            await Task.Delay(20);
            Assert.False(modifyEvent.IsSet);

            name = null;
            topic = null;
            timeoutEvent.Set();

            // Assert.
            await modifyEvent.WaitAsyncWithTimeout(5000);
            Assert.NotNull(name);
            Assert.NotNull(topic);
        }

        [Fact]
        public async Task LogsExceptions()
        {
            // Arrange.
            string expectedState = "QueueConsumer";

            var exception = new Exception("test");

            var finishedLogging = new AsyncManualResetEvent();
            var logger = new TestLogger<ChannelUpdater>((_, __) => finishedLogging.Set());

            var channelUpdater = MakeChannelUpdater((_, __) => throw exception, logger: logger);

            // Act.
            channelUpdater.ScheduleUpdate();
            await finishedLogging.WaitAsyncWithTimeout(5000);

            // Assert.
            logger.AssertContainsLog(LogLevel.Error, expectedState, exception);
        }

        [Fact]
        public async Task CanModifyAfterException()
        {
            // Arrange.
            int count = 0;
            string? name = null;
            string? topic = null;
            var modifyEvent = new AsyncManualResetEvent();

            var finishedLogging = new AsyncManualResetEvent();
            var logger = new TestLogger<ChannelUpdater>((_, __) => finishedLogging.Set());

            var channelUpdater = MakeChannelUpdater((n, t) =>
            {
                count++;

                if (count == 1)
                {
                    throw new Exception();
                }

                name = n;
                topic = t;
                modifyEvent.Set();
            }, logger: logger);

            channelUpdater.ScheduleUpdate();
            await finishedLogging.WaitAsyncWithTimeout(5000);

            // Act.
            channelUpdater.ScheduleUpdate();
            await modifyEvent.WaitAsyncWithTimeout(5000);

            // Assert.
            Assert.Equal(2, count);
            Assert.NotNull(name);
            Assert.NotNull(topic);
        }

        [Fact]
        public async Task CanceledException_ReSchedules()
        {
            // Arrange.
            int count = 0;
            string? name = null;
            string? topic = null;
            var modifyEvent = new AsyncManualResetEvent();

            var channelUpdater = MakeChannelUpdater((n, t) =>
            {
                count++;

                if (count == 1)
                {
                    throw new OperationCanceledException();
                }

                name = n;
                topic = t;
                modifyEvent.Set();
            });

            // Act.
            channelUpdater.ScheduleUpdate();
            await modifyEvent.WaitAsyncWithTimeout(5000);

            // Assert.
            Assert.Equal(2, count);
            Assert.NotNull(name);
            Assert.NotNull(topic);
        }

        [Fact]
        public async Task AfterDispose_DoesNotModify()
        {
            // Arrange.            
            string? name = null;
            string? topic = null;
            var modifyEvent = new AsyncManualResetEvent();

            var channelUpdater = MakeChannelUpdater((n, t) =>
            {
                name = n;
                topic = t;
                modifyEvent.Set();
            });

            channelUpdater.Dispose();

            // Act.
            channelUpdater.ScheduleUpdate();
            await Task.Delay(20);

            // Assert.
            Assert.Null(name);
            Assert.Null(topic);
        }

        private ChannelUpdater MakeChannelUpdater(
            Action<string, string>? callback = null,
            IFactorioServerDataService? factorioServerDataService = null,
            TestLogger<ChannelUpdater>? logger = null,
            ITimeSystem? timeSystem = null)
        {
            if (factorioServerDataService == null)
            {
                var serverData = ServerDataHelper.MakeServerData();

                var factorioServerDataServiceMock = new Mock<IFactorioServerDataService>(MockBehavior.Strict);
                factorioServerDataServiceMock.Setup(x => x.TryGetServerData(It.IsAny<string>(), out serverData)).Returns(true);
                factorioServerDataService = factorioServerDataServiceMock.Object;
            }

            if (timeSystem == null)
            {
                var timeSystemMock = new Mock<ITimeSystem>(MockBehavior.Strict);
                timeSystemMock.Setup(x => x.Delay(It.IsAny<TimeSpan>())).Returns(Task.CompletedTask);
                timeSystem = timeSystemMock.Object;
            }

            return new ChannelUpdater(
                factorioServerDataService,
                logger ?? new TestLogger<ChannelUpdater>(),
                timeSystem,
                MakeTextChannel(callback ?? ((_, __) => { })),
                "1");
        }

        private static ITextChannel MakeTextChannel(Action<string, string> callback)
        {
            var channel = new Mock<ITextChannel>(MockBehavior.Strict);
            channel.Setup(x => x.ModifyAsync(It.IsAny<Action<TextChannelProperties>>(), It.IsAny<RequestOptions>()))
                .Returns((Action<TextChannelProperties> func, RequestOptions _) =>
                {
                    var prop = new TextChannelProperties();
                    func(prop);
                    callback(prop.Name.GetValueOrDefault(), prop.Topic.GetValueOrDefault());
                    return Task.CompletedTask;
                });

            return channel.Object;
        }
    }
}
