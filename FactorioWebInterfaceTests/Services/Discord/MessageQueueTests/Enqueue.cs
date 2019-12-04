using Discord;
using FactorioWebInterface.Services.Discord;
using FactorioWebInterface.Utils;
using FactorioWebInterfaceTests.Utils;
using Microsoft.Extensions.Logging;
using Moq;
using Nito.AsyncEx;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace FactorioWebInterfaceTests.Services.Discord.MessageQueueTests
{
    public class Enqueue
    {
        [Fact]
        public async Task DoesSendTextMessage()
        {
            // Arrange.
            const string input = "Some text";

            var sent = new TaskCompletionSource<string>();

            void Callback(string text, Embed embed)
            {
                sent.TrySetResult(text);
            }

            var queue = MakeMessageQueue(Callback);

            // Act.
            queue.Enqueue(input);
            await sent.Task.TimeoutAfter(1000);

            // Assert.
            Assert.Equal(input, sent.Task.Result);
        }

        [Fact]
        public async Task DoesSendEmbedMessage()
        {
            // Arrange.
            Embed input = new EmbedBuilder().Build();

            var sent = new TaskCompletionSource<Embed>();

            void Callback(string text, Embed embed)
            {
                sent.TrySetResult(embed);
            }

            var queue = MakeMessageQueue(Callback);

            // Act.
            queue.Enqueue(input);
            await sent.Task.TimeoutAfter(1000);

            // Assert.
            Assert.Equal(input, sent.Task.Result);
        }

        [Fact]
        public async Task MultipleTextMessagesAreBatched()
        {
            // Arrange.
            var timeout = new CancellationTokenSource(1000).Token;

            List<string> messages = new List<string>()
            {
                "message 1",
                "message 2",
                "message 3",
            };

            var messagesSent = new AsyncManualResetEvent();
            var callbackEntered = new AsyncManualResetEvent();

            List<string> batches = new List<string>();
            var batchesSent = new AsyncManualResetEvent();

            void Callback(string text, Embed embed)
            {
                if (batches.Count == 0)
                {
                    callbackEntered.Set();
                }

                messagesSent.Wait(timeout);

                batches.Add(text);
                if (batches.Count == 2)
                {
                    batchesSent.Set();
                }
            }

            var queue = MakeMessageQueue(Callback);

            // Act.
            foreach (var message in messages)
            {
                queue.Enqueue(message);
                await callbackEntered.WaitAsync(timeout);
            }

            messagesSent.Set();
            await batchesSent.WaitAsync(timeout);

            // Assert.     
            Assert.Equal(2, batches.Count);
            Assert.Equal("message 1", batches[0]);
            Assert.Equal("message 2\nmessage 3", batches[1]);
        }

        [Fact]
        public async Task SendsBatchBeforeSendingEmbed()
        {
            // Arrange.
            string firstMessage = "firstMessage";
            string textMessage = "textMessage";
            Embed embedMessage = new EmbedBuilder().Build();
            string lastMessage = "lastMessage";

            var timeout = new CancellationTokenSource(1000).Token;

            var messagesSent = new AsyncManualResetEvent();
            var callbackEntered = new AsyncManualResetEvent();

            string actualText = null;
            Embed actualEmbed = null;
            string actaulLastText = null;

            int calls = 0;
            var batchesSent = new AsyncManualResetEvent();

            void Callback(string text, Embed embed)
            {
                calls++;

                if (calls == 1)
                {
                    callbackEntered.Set();
                    messagesSent.WaitAsync(timeout);
                    return;
                }

                if (calls == 2)
                {
                    actualText = text;
                    return;
                }

                if (calls == 3)
                {
                    actualEmbed = embed;
                    return;
                }

                if (calls == 4)
                {
                    actaulLastText = text;
                    batchesSent.Set();
                }
            }

            var queue = MakeMessageQueue(Callback);

            // Act.
            queue.Enqueue(firstMessage);
            await callbackEntered.WaitAsync(timeout);
            queue.Enqueue(textMessage);
            queue.Enqueue(embedMessage);
            queue.Enqueue(lastMessage);

            messagesSent.Set();
            await batchesSent.WaitAsync(timeout);

            // Assert.     
            Assert.Equal(4, calls);
            Assert.Equal(textMessage, actualText);
            Assert.Equal(embedMessage, actualEmbed);
            Assert.Equal(lastMessage, actaulLastText);
        }

        [Theory]
        [InlineData(true)]
        [InlineData(false)]
        public async Task LogsExceptions(bool text)
        {
            // Arrange.
            string expectedState = text ? "SendBatch" : "SendEmbed";

            var exception = new Exception("test");
            void Callback(string text, Embed embed)
            {
                throw exception;
            }

            var finishedLogging = new AsyncManualResetEvent();
            var logger = new TestLogger<MessageQueue>((_, __) => finishedLogging.Set());

            var queue = MakeMessageQueue(Callback, logger);

            // Act.
            if (text)
            {
                queue.Enqueue("Some text");
            }
            else
            {
                queue.Enqueue(new EmbedBuilder().Build());
            }
            await finishedLogging.WaitAsyncWithTimeout(1000);

            // Assert.
            logger.AssertContainsLog(LogLevel.Error, expectedState, exception);
        }

        [Fact]
        public async Task CanSendMessagesAfterException()
        {
            // Arrange.
            var exception = new Exception("test");
            bool shouldThrow = true;
            const string secondInput = "Some text 2";
            var sent = new TaskCompletionSource<string>();

            void Callback(string text, Embed embed)
            {
                if (shouldThrow)
                {
                    throw exception;
                }

                sent.SetResult(text);
            }

            var finishedLogging = new AsyncManualResetEvent();
            var logger = new TestLogger<MessageQueue>((_, __) => finishedLogging.Set());

            var queue = MakeMessageQueue(Callback, logger);

            queue.Enqueue("Some text");
            await finishedLogging.WaitAsyncWithTimeout(1000);
            logger.AssertContainsLog(LogLevel.Error, "SendBatch", exception);
            shouldThrow = false;

            // Act.           
            queue.Enqueue(secondInput);
            await sent.Task.TimeoutAfter(1000);

            // Assert.
            Assert.Equal(secondInput, sent.Task.Result);
        }

        [Theory]
        [InlineData(true)]
        [InlineData(false)]
        public async Task AfterDispose_EnqueueDoesNotSend(bool sendText)
        {
            // Arrange.
            object sent = null;
            void Callback(string text, Embed embed)
            {
                if (sendText)
                {
                    sent = text;
                }
                else
                {
                    sent = embed;
                }
            }

            var queue = MakeMessageQueue(Callback);

            // Act.
            queue.Dispose();

            if (sendText)
            {
                queue.Enqueue("Some text");
            }
            else
            {
                queue.Enqueue(new EmbedBuilder().Build());
            }

            await Task.Delay(20);

            // Assert.
            Assert.Null(sent);
        }

        private MessageQueue MakeMessageQueue(Action<string, Embed> callback = null, TestLogger<MessageQueue> logger = null)
        {
            return new MessageQueue(
                MakeChannel(callback ?? ((_, __) => { })),
                logger ?? new TestLogger<MessageQueue>());
        }

        private static IMessageChannel MakeChannel(Action<string, Embed> callback)
        {
            var channel = new Mock<IMessageChannel>(MockBehavior.Strict);
            channel.Setup(x => x.SendMessageAsync(It.IsAny<string>(), false, It.IsAny<Embed>(), null))
                .Returns((string text, bool _, Embed embed, RequestOptions __) =>
                {
                    callback(text, embed);
                    return Task.FromResult((IUserMessage)null);
                });

            return channel.Object;
        }
    }
}
