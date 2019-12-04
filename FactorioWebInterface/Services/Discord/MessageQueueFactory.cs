using Discord;
using Microsoft.Extensions.Logging;

namespace FactorioWebInterface.Services.Discord
{
    public interface IMessageQueueFactory
    {
        IMessageQueue Create(IMessageChannel channel);
    }

    public class MessageQueueFactory : IMessageQueueFactory
    {
        private readonly ILogger<MessageQueue> _logger;

        public MessageQueueFactory(ILogger<MessageQueue> logger)
        {
            _logger = logger;
        }

        public IMessageQueue Create(IMessageChannel channel) => new MessageQueue(channel, _logger);
    }
}
