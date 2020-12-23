using Discord;
using FactorioWebInterface.Services.Discord;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Xunit;

namespace FactorioWebInterfaceTests.Services.Discord.DiscordBotCommandHelpBuilderTests
{
    public class BuildHelp
    {
        [Theory]
        [InlineData("ping")]
        [InlineData("p")]
        [InlineData("setserver")]
        [InlineData("s")]
        [InlineData("unset")]
        [InlineData("u")]
        [InlineData("setnamed")]
        [InlineData("sn")]
        [InlineData("unsetnamed")]
        [InlineData("un")]
        [InlineData("listnamed")]
        [InlineData("ln")]
        [InlineData("setadmin")]
        [InlineData("a")]
        [InlineData("help")]
        [InlineData("h")]
        [InlineData("?")]
        public void CanLookupCommandForDiscordBotCommands(string commandName)
        {
            // Arrange.
            (var commandLookup, var _) = DiscordBotCommandHelpBuilder.BuildHelp<DiscordBotCommands>();

            // Act.
            bool result = commandLookup.TryGetValue(commandName, out Embed? value);

            // Assert.
            Assert.True(result);
            Assert.NotNull(value);
        }

        [Theory]
        [InlineData("ping")]
        [InlineData("setserver")]
        [InlineData("unset")]
        [InlineData("setnamed")]
        [InlineData("unsetnamed")]
        [InlineData("listnamed")]
        [InlineData("setadmin")]
        [InlineData("help")]
        public void HelpListingsShowsAllCommandsForDiscordBotCommands(string commandName)
        {
            // Arrange.
            (var _, var commandListings) = DiscordBotCommandHelpBuilder.BuildHelp<DiscordBotCommands>();

            // Act.
            bool found = commandListings.Fields.Any(f => f.Name.Contains(commandName));

            // Assert.
            Assert.True(found);
        }
    }
}
