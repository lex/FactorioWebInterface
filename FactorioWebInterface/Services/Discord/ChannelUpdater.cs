using Discord;
using FactorioWebInterface.Utils;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Channels;
using System.Threading.Tasks;

namespace FactorioWebInterface.Services.Discord
{
    public interface IChannelUpdater : IDisposable
    {
        void ScheduleUpdate();
    }

    public sealed class ChannelUpdater : IChannelUpdater
    {
        private static TimeSpan requestTimeout = TimeSpan.FromSeconds(10);
        private static TimeSpan throttleTimeout = TimeSpan.FromMinutes(5);

        private readonly IFactorioServerDataService _factorioServerDataService;
        private readonly ILogger<ChannelUpdater> _logger;
        private readonly ITimeSystem _timeSystem;

        private readonly ITextChannel channel;
        private readonly string serverId;

        private readonly ChannelWriter<Unit> queueWriter;

        public ChannelUpdater(
            IFactorioServerDataService factorioServerDataService,
            ILogger<ChannelUpdater> logger,
            ITimeSystem timeSystem,
            ITextChannel channel,
            string serverId)
        {
            _factorioServerDataService = factorioServerDataService;
            _logger = logger;
            _timeSystem = timeSystem;

            this.channel = channel;
            this.serverId = serverId;

            var options = new BoundedChannelOptions(capacity: 1)
            {
                AllowSynchronousContinuations = false,
                SingleReader = true,
                SingleWriter = false,
                FullMode = BoundedChannelFullMode.DropWrite
            };

            var queue = Channel.CreateBounded<Unit>(options);
            queueWriter = queue.Writer;

            QueueConsumer(queue.Reader);
        }

        public void ScheduleUpdate()
        {
            queueWriter.TryWrite(default);
        }

        public void Dispose()
        {
            queueWriter.TryComplete();
        }

        private async void QueueConsumer(ChannelReader<Unit> reader)
        {
            while (await reader.WaitToReadAsync())
            {
                while (reader.TryRead(out _)) { }

                try
                {
                    await DoUpdate();
                    await _timeSystem.Delay(throttleTimeout);
                }
                catch (OperationCanceledException)
                {
                    ScheduleUpdate();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, nameof(QueueConsumer));
                }
            }
        }

        private async Task DoUpdate()
        {
            var status = await GetChannelStatus();
            string? name = status.Name;
            string? topic = status.Topic;

            if (name == null && topic == null)
            {
                return;
            }

            void Modify(TextChannelProperties props)
            {
                if (name != null)
                {
                    props.Name = name;
                }

                if (topic != null)
                {
                    props.Topic = topic;
                }
            }

            using var tokenSource = new CancellationTokenSource(requestTimeout);

            var requestOptions = new RequestOptions()
            {
                RetryMode = RetryMode.RetryRatelimit,
                CancelToken = tokenSource.Token
            };

            await channel.ModifyAsync(Modify, requestOptions);
        }

        private Task<ChannelStatus> GetChannelStatus()
        {
            if (!_factorioServerDataService.TryGetServerData(serverId, out Models.FactorioServerData? serverData))
            {
                return Task.FromResult(new ChannelStatus());
            }

            return serverData.LockAsync(ChannelStatusProvider.GetStatus);
        }
    }
}
