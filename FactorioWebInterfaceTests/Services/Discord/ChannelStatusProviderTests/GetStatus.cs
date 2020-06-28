using FactorioWebInterface;
using FactorioWebInterface.Models;
using FactorioWebInterface.Services.Discord;
using FactorioWebInterfaceTests.Utils;
using Shared;
using System.Collections.Generic;
using Xunit;

namespace FactorioWebInterfaceTests.Services.Discord.ChannelStatusProviderTests
{
    public class GetStatus
    {
        [Theory]
        [InlineData("s1-name-0_0_0", FactorioServerStatus.Running)]
        [InlineData("s1-offline", FactorioServerStatus.Stopped)]
        public void WhenSettingNameIsEnabled_NameIsSet(string expectedName, FactorioServerStatus status)
        {
            // Arrange.
            var data = ServerDataHelper.MakeMutableData();
            data.Status = status;
            data.Version = "0.0.0";
            data.ServerExtraSettings.SetDiscordChannelName = true;
            data.ServerSettings = new FactorioServerSettings() { Name = "name" };

            // Act.
            var channelStatus = ChannelStatusProvider.GetStatus(data);

            // Assert.
            Assert.Equal(expectedName, channelStatus.Name);
        }

        [Theory]
        [InlineData(FactorioServerStatus.Running)]
        [InlineData(FactorioServerStatus.Stopped)]
        public void WhenSettingNameIsDisabled_NameIsNull(FactorioServerStatus status)
        {
            // Arrange.
            var data = ServerDataHelper.MakeMutableData();
            data.Status = status;
            data.Version = "0.0.0";
            data.ServerExtraSettings.SetDiscordChannelName = false;
            data.ServerSettings = new FactorioServerSettings() { Name = "name" };

            // Act.
            var channelStatus = ChannelStatusProvider.GetStatus(data);

            // Assert.
            Assert.Null(channelStatus.Name);
        }

        [Theory]
        [InlineData("Players online 0", FactorioServerStatus.Running)]
        [InlineData("Server offline", FactorioServerStatus.Stopped)]
        public void WhenSettingTopicIsEnabled_TopicIsSet(string expectedTopic, FactorioServerStatus status)
        {
            // Arrange.
            var data = ServerDataHelper.MakeMutableData();
            data.Status = status;
            data.ServerExtraSettings.SetDiscordChannelTopic = true;

            // Act.
            var channelStatus = ChannelStatusProvider.GetStatus(data);

            // Assert.
            Assert.Equal(expectedTopic, channelStatus.Topic);
        }

        [Theory]
        [InlineData(FactorioServerStatus.Running)]
        [InlineData(FactorioServerStatus.Stopped)]
        public void WhenSettingTopicIsDisabled_TopicIsNull(FactorioServerStatus status)
        {
            // Arrange.
            var data = ServerDataHelper.MakeMutableData();
            data.Status = status;
            data.ServerExtraSettings.SetDiscordChannelTopic = false;

            // Act.
            var channelStatus = ChannelStatusProvider.GetStatus(data);

            // Assert.
            Assert.Null(channelStatus.Topic);
        }

        [Theory]
        [InlineData("s1-name-0_0_0", 1, "name", "0.0.0")]
        [InlineData("s2-name-0_0_0", 2, "name", "0.0.0")]
        [InlineData("s1-multi word name-0_0_0", 1, "multi word name", "0.0.0")]
        [InlineData("s1-name-1_23_456", 1, "name", "1.23.456")]
        public void NameIsCorrect(string expectedName, int serverNumber, string name, string version)
        {
            // Arrange.
            var data = ServerDataHelper.MakeMutableData(serverNumber);
            data.Status = FactorioServerStatus.Running;
            data.Version = version;
            data.ServerExtraSettings.SetDiscordChannelName = true;
            data.ServerSettings = new FactorioServerSettings() { Name = name };

            // Act.
            var channelStatus = ChannelStatusProvider.GetStatus(data);

            // Assert.
            Assert.Equal(expectedName, channelStatus.Name);
        }

        public static object?[][] TopicIsCorrectTestCases => new object?[][]
        {
            new object?[]{"Players online 0", 0, new SortedList<string, int>()},
            new object?[]{"Players online 1 - player", 1, new SortedList<string, int>() {["player"] = 1 } },
            new object?[]{"Players online 2 - player1, player2", 2, new SortedList<string, int>()
            {
                ["player1"] = 1,
                ["player2"] = 1
            }},
            new object?[]{"Players online 3 - player1, player2, player3", 3, new SortedList<string, int>()
            {
                ["player1"] = 1,
                ["player2"] = 1,
                ["player3"] = 1,
            }},
            new object?[]{"Players online 3 - player1, player1, player2", 3, new SortedList<string, int>()
            {
                ["player1"] = 2,
                ["player2"] = 1
            }},
        };

        [Theory]
        [MemberData(nameof(TopicIsCorrectTestCases))]
        public void TopicIsCorrect(string expectedTopic, int onlinePlayerCount, SortedList<string, int> onlinePlayers)
        {
            // Arrange.
            var data = ServerDataHelper.MakeMutableData();
            data.OnlinePlayers = onlinePlayers;
            data.OnlinePlayerCount = onlinePlayerCount;
            data.ServerExtraSettings.SetDiscordChannelTopic = true;
            data.Status = FactorioServerStatus.Running;

            // Act.
            var channelStatus = ChannelStatusProvider.GetStatus(data);

            // Assert.
            Assert.Equal(expectedTopic, channelStatus.Topic);
        }

        [Fact]
        public void TopicIsCappedAtMaxLength()
        {
            // Arrange.
            var data = ServerDataHelper.MakeMutableData();
            data.OnlinePlayers = new SortedList<string, int>()
            {
                [new string('a', Constants.discordTopicMaxLength)] = 1
            };
            data.OnlinePlayerCount = 1;
            data.ServerExtraSettings.SetDiscordChannelTopic = true;
            data.Status = FactorioServerStatus.Running;

            // Act.
            var channelStatus = ChannelStatusProvider.GetStatus(data);

            // Assert.
            Assert.EndsWith("...", channelStatus.Topic);
            Assert.Equal(Constants.discordTopicMaxLength, channelStatus.Topic!.Length);
        }
    }
}
