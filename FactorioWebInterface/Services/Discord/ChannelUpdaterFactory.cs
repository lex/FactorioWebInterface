using Discord;
using FactorioWebInterface.Utils;
using Microsoft.Extensions.Logging;

namespace FactorioWebInterface.Services.Discord
{
    public interface IChannelUpdaterFactory
    {
        IChannelUpdater Create(ITextChannel channel, string serverId);
    }

    public class ChannelUpdaterFactory : IChannelUpdaterFactory
    {
        private readonly IFactorioServerDataService _factorioServerDataService;
        private readonly ILogger<ChannelUpdater> _logger;
        private readonly ITimeSystem _timeSystem;

        public ChannelUpdaterFactory(IFactorioServerDataService factorioServerDataService, ILogger<ChannelUpdater> logger, ITimeSystem timeSystem)
        {
            _factorioServerDataService = factorioServerDataService;
            _logger = logger;
            _timeSystem = timeSystem;
        }

        public IChannelUpdater Create(ITextChannel channel, string serverId) => new ChannelUpdater(_factorioServerDataService, _logger, _timeSystem, channel, serverId);
    }
}
