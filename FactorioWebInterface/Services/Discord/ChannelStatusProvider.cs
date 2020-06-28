using FactorioWebInterface.Models;
using Shared;
using System.Collections.Generic;
using System.Text;
using System.Text.RegularExpressions;

namespace FactorioWebInterface.Services.Discord
{
    public struct ChannelStatus
    {
        public string? Name { get; }
        public string? Topic { get; }

        public ChannelStatus(string? name, string? topic)
        {
            Name = name;
            Topic = topic;
        }
    }

    public static class ChannelStatusProvider
    {
        // Match all [*]. 
        private static readonly Regex serverTagRegex = new Regex(@"\[.*?\]", RegexOptions.Compiled);

        public static ChannelStatus GetStatus(FactorioServerMutableData mutableData)
        {
            if (mutableData.Status == FactorioServerStatus.Running)
            {
                string? name = null;
                if (mutableData.ServerExtraSettings.SetDiscordChannelName)
                {
                    string cleanServerName = serverTagRegex.Replace(mutableData.ServerSettings?.Name ?? "", "");
                    string cleanVersion = mutableData.Version.Replace('.', '_');

                    name = $"s{mutableData.ServerId}-{cleanServerName}-{cleanVersion}";
                }

                string? topic = null;
                if (mutableData.ServerExtraSettings.SetDiscordChannelTopic)
                {
                    topic = BuildServerTopicFromOnlinePlayers(mutableData.OnlinePlayers, mutableData.OnlinePlayerCount);
                }

                return new ChannelStatus(name, topic);
            }
            else
            {
                string? name = null;
                if (mutableData.ServerExtraSettings.SetDiscordChannelName)
                {
                    name = $"s{mutableData.ServerId}-offline";
                }

                string? topic = null;
                if (mutableData.ServerExtraSettings.SetDiscordChannelTopic)
                {
                    topic = "Server offline";
                }

                return new ChannelStatus(name, topic);
            }
        }

        private static string BuildServerTopicFromOnlinePlayers(SortedList<string, int> onlinePlayers, int count)
        {
            var sb = new StringBuilder();

            if (count == 0)
            {
                sb.Append("Players online 0");
                return sb.ToString();
            }
            else
            {
                sb.Append("Players online ").Append(count);
            }

            sb.Append(" - ");
            foreach (var item in onlinePlayers)
            {
                for (int i = 0; i < item.Value; i++)
                {
                    sb.Append(item.Key).Append(", ");
                }

                if (sb.Length > Constants.discordTopicMaxLength)
                {
                    const int start = Constants.discordTopicMaxLength - 3;
                    int length = sb.Length - start;
                    sb.Remove(start, length);
                    sb.Append("...");
                    return sb.ToString();
                }
            }
            sb.Length -= 2;

            return sb.ToString();
        }
    }
}
