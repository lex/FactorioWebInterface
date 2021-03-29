using Discord;
using Discord.Rest;
using Discord.WebSocket;
using FactorioWebInterface.Services.Discord;
using Moq;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;

namespace FactorioWebInterfaceTests.Services.Discord.DiscordBotHelpServiceTests
{
    public class DoHelp
    {
        private const string CommandPrefix = ";;";

        DiscordBotHelpService<TestCommands> _helpService;
        private Dictionary<string, Embed> commandLookup;
        private Embed commandListings;

        public DoHelp()
        {
            _helpService = new DiscordBotHelpService<TestCommands>(null!);
            (commandLookup, commandListings) = DiscordBotCommandHelpBuilder.BuildHelp<TestCommands>();
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData(" ")]
        [InlineData(CommandPrefix)]
        [InlineData(CommandPrefix + " ")]
        [InlineData(" " + CommandPrefix)]
        [InlineData(" " + CommandPrefix + " ")]
        public async Task NoCommandGetListings(string? commandName)
        {
            // Arrange.
            int timesCalled = 0;
            Embed? embed = null;
            void Callback(Embed e)
            {
                timesCalled++;
                embed = e;
            }
            var channel = TestChannel(Callback);

            // Act.
            await _helpService.DoHelp(channel, commandName);

            // Assert.            
            Assert.Equal(1, timesCalled);
            Assert.NotNull(embed);
            Assert.Equal(commandListings.Title, embed!.Title);
            Assert.Equal(commandListings.Description, embed.Description);
        }

        [Theory]
        [InlineData(nameof(TestCommands.CommandOne), nameof(TestCommands.CommandOne))]
        [InlineData(nameof(TestCommands.CommandTwo), nameof(TestCommands.CommandTwo))]
        [InlineData(" " + nameof(TestCommands.CommandOne), nameof(TestCommands.CommandOne))]
        [InlineData(nameof(TestCommands.CommandOne) + " ", nameof(TestCommands.CommandOne))]
        [InlineData(" " + nameof(TestCommands.CommandOne) + " ", nameof(TestCommands.CommandOne))]
        [InlineData(CommandPrefix + nameof(TestCommands.CommandOne), nameof(TestCommands.CommandOne))]
        [InlineData(" " + CommandPrefix + nameof(TestCommands.CommandOne), nameof(TestCommands.CommandOne))]
        public async Task NamedCommandGetsLookupEmbed(string commandName, string lookupName)
        {
            // Arrange.
            Embed expected = commandLookup[lookupName];

            int timesCalled = 0;
            Embed? embed = null;
            void Callback(Embed e)
            {
                timesCalled++;
                embed = e;
            }
            var channel = TestChannel(Callback);

            // Act.
            await _helpService.DoHelp(channel, commandName);

            // Assert.            
            Assert.Equal(1, timesCalled);
            Assert.NotNull(embed);
            Assert.Equal(expected.Title, embed!.Title);
            Assert.Equal(expected.Description, embed.Description);
        }

        [Theory]
        [InlineData("unknowncommand", "unknowncommand")]
        [InlineData("wrongcommand", "wrongcommand")]
        [InlineData(" unknowncommand", "unknowncommand")]
        [InlineData("unknowncommand ", "unknowncommand")]
        [InlineData(" unknowncommand ", "unknowncommand")]
        [InlineData(CommandPrefix + "unknowncommand", "unknowncommand")]
        [InlineData(" " + CommandPrefix + "unknowncommand", "unknowncommand")]
        public async Task UnknownCommandGetsErrorFollowedByListings(string commandName, string lookupName)
        {
            // Arrange.
            List<Embed> calls = new List<Embed>();
            void Callback(Embed e)
            {
                calls.Add(e);
            }
            var channel = TestChannel(Callback);

            // Act.
            await _helpService.DoHelp(channel, commandName);

            // Assert.            
            Assert.Equal(2, calls.Count);
            Embed first = calls[0];
            Assert.NotNull(first);
            Assert.Contains(lookupName, first.Description);
            Embed second = calls[1];
            Assert.Equal(commandListings.Title, second.Title);
            Assert.Equal(commandListings.Description, second.Description);
        }

        private ISocketMessageChannel TestChannel(Action<Embed> callback)
        {
            var channelMock = new Mock<ISocketMessageChannel>(MockBehavior.Strict);
            channelMock.Setup(x => x.SendMessageAsync(It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<Embed>(), It.IsAny<RequestOptions>(), It.IsAny<AllowedMentions>(), It.IsAny<MessageReference>()))
                .Returns(Task.FromResult<RestUserMessage>(null!))
                .Callback((string _, bool __, Embed embed, RequestOptions ___, AllowedMentions ____, MessageReference _____) => callback(embed));

            return channelMock.Object;
        }
    }
}
