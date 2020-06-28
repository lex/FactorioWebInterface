using Castle.DynamicProxy.Generators;
using Discord;
using Discord.WebSocket;
using FactorioWebInterface.Data;
using FactorioWebInterface.Services;
using FactorioWebInterface.Services.Discord;
using FactorioWebInterfaceTests.Utils;
using Microsoft.Extensions.Logging;
using Moq;
using System;
using System.Collections.Generic;

namespace FactorioWebInterfaceTests.Services.Discord.DiscordServiceTests
{
    public class DiscordServiceTestBase : IDisposable
    {
        public IDiscordServiceConfiguration Configuration { get; protected set; }
        public IDiscordClientWrapper Client { get; protected set; }
        public IDiscordMessageHandlingService MessageService { get; protected set; }
        public IDbContextFactory DbContextFactory { get; }
        public IFactorioServerDataService FactorioServerDataService { get; protected set; }
        public ILogger<DiscordService> Logger { get; }
        public IMessageQueueFactory MessageQueueFactory { get; protected set; }
        public IChannelUpdaterFactory ChannelUpdaterFactory { get; protected set; }

        private DiscordService? discordService;
        public DiscordService DiscordService => discordService ?? (discordService = MakeDiscordService());

        public DiscordServiceTestBase(
            IDiscordServiceConfiguration? configuration = null,
            IDiscordClientWrapper? client = null,
            IDiscordMessageHandlingService? messageService = null,
            IDbContextFactory? dbContextFactory = null,
            IFactorioServerDataService? factorioServerDataService = null,
            ILogger<DiscordService>? logger = null,
            IMessageQueueFactory? messageQueueFactory = null,
            IChannelUpdaterFactory? channelUpdaterFactory = null)
        {
            Configuration = configuration ?? new DiscordServiceConfiguration(0, new HashSet<ulong>());
            Client = client ?? new Mock<IDiscordClientWrapper>(MockBehavior.Strict).Object;
            MessageService = messageService ?? new Mock<IDiscordMessageHandlingService>(MockBehavior.Loose).Object;
            DbContextFactory = dbContextFactory ?? new TestDbContextFactory();
            FactorioServerDataService = factorioServerDataService ?? new Mock<IFactorioServerDataService>(MockBehavior.Strict).Object;
            Logger = logger ?? new TestLogger<DiscordService>();
            MessageQueueFactory = messageQueueFactory ?? new Mock<IMessageQueueFactory>(MockBehavior.Strict).Object;
            ChannelUpdaterFactory = channelUpdaterFactory ?? new Mock<IChannelUpdaterFactory>(MockBehavior.Strict).Object;
        }

        public DiscordService MakeDiscordService()
        {
            return new DiscordService(
                Configuration,
                Client,
                MessageService,
                DbContextFactory,
                FactorioServerDataService,
                Logger,
                MessageQueueFactory,
                ChannelUpdaterFactory);
        }

        public void Dispose()
        {
            (DbContextFactory as IDisposable)?.Dispose();
        }

        public static IMessageQueueFactory MakeMessageQueueFactory(Action<string, Embed>? enqueueCallback = null, Action? disposeCallback = null)
        {
            var queue = new Mock<IMessageQueue>(MockBehavior.Strict);
            queue.Setup(x => x.Enqueue(It.IsAny<string>(), It.IsAny<Embed>())).Callback(enqueueCallback ?? ((_, __) => { }));
            queue.Setup(x => x.Dispose()).Callback(disposeCallback ?? (() => { }));

            var factory = new Mock<IMessageQueueFactory>(MockBehavior.Strict);
            factory.Setup(x => x.Create(It.IsAny<IMessageChannel>())).Returns(queue.Object);

            return factory.Object;
        }

        public static IChannelUpdaterFactory MakeChannelUpdaterFactory(Action? enqueueCallback = null, Action? disposeCallback = null)
        {
            var update = new Mock<IChannelUpdater>(MockBehavior.Strict);
            update.Setup(x => x.ScheduleUpdate()).Callback(enqueueCallback ?? (() => { }));
            update.Setup(x => x.Dispose()).Callback(disposeCallback ?? (() => { }));

            var factory = new Mock<IChannelUpdaterFactory>(MockBehavior.Strict);
            factory.Setup(x => x.Create(It.IsAny<ITextChannel>(), It.IsAny<string>())).Returns(update.Object);

            return factory.Object;
        }

        public static Mock<IDiscordClientWrapper> MakeMockClientThatExpectGetChannel(ulong channelId)
        {
            var clientMock = new Mock<IDiscordClientWrapper>();
            clientMock.Setup(x => x.GetChannel(channelId))
                .Returns(new Mock<ITextChannel>().Object)
                .Verifiable();

            return clientMock;
        }

    }
}
