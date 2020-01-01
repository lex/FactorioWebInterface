using Discord;
using FactorioWebInterface.Services.Utils;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Channels;
using System.Threading.Tasks;

namespace FactorioWebInterface.Services.Discord
{
    public interface IMessageQueue : IDisposable
    {
        void Enqueue(string? text = null, Embed? embed = null);
    }

    public sealed class MessageQueue : IMessageQueue
    {
        private readonly struct Message
        {
            public string? Text { get; }
            public Embed? Embed { get; }

            public Message(string? text = null, Embed? embed = null)
            {
                Text = text;
                Embed = embed;
            }
        }

        private readonly IMessageChannel channel;
        private readonly ILogger<MessageQueue> logger;
        private readonly ChannelWriter<Message> queueWriter;

        public MessageQueue(IMessageChannel channel, ILogger<MessageQueue> logger)
        {
            this.channel = channel;
            this.logger = logger;

            var options = new BoundedChannelOptions(capacity: 1024)
            {
                AllowSynchronousContinuations = false,
                SingleReader = true,
                SingleWriter = false,
                FullMode = BoundedChannelFullMode.DropOldest
            };
            var queue = Channel.CreateBounded<Message>(options);
            queueWriter = queue.Writer;

            QueueConsumer(queue.Reader);
        }

        private async void QueueConsumer(ChannelReader<Message> reader)
        {
            TextBatcher batcher = new TextBatcher(Constants.discordMaxMessageLength);

            async ValueTask SendBatch(Embed? embed = null)
            {
                try
                {
                    string batch = batcher.MakeBatch();
                    if (batch.Length > 0 || embed != null)
                    {
                        await channel.SendMessageAsync(batch, embed: embed);
                    }
                }
                catch (Exception e)
                {
                    logger.LogError(e, nameof(SendBatch));
                }
            }

            while (await reader.WaitToReadAsync())
            {
                while (reader.TryRead(out Message message))
                {
                    if (message.Embed is Embed embed)
                    {
                        await SendBatch(embed);
                    }

                    if (message.Text is string text && !batcher.TryAdd(text))
                    {
                        await SendBatch();
                        batcher.TryAdd(text);
                    }
                }

                await SendBatch();
            }
        }

        public void Enqueue(string? text = null, Embed? embed = null)
        {
            queueWriter.TryWrite(new Message(text, embed));
        }

        public void Dispose()
        {
            queueWriter.TryComplete();
        }
    }
}
