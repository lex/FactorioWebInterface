using Discord;
using Discord.Commands;
using FactorioWebInterface.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;

namespace FactorioWebInterface.Services.Discord
{
    public static class DiscordBotCommandHelpBuilder
    {
        private class CommandData
        {
            public string? Name { get; set; }
            public string? Summary { get; set; }
            public string? Remark { get; set; }
            public List<string> Exmaples { get; } = new List<string>();
            public List<ParamaterData> Paramaters { get; } = new List<ParamaterData>();
            public string[] Alias { get; set; } = Array.Empty<string>();
        }

        private class ParamaterData
        {
            public string? Name { get; set; }
            public string? Summary { get; set; }
            public bool IsOptional { get; set; }
        }

        public static (Dictionary<string, Embed> commandLookup, Embed commandListings) BuildHelp<T>(IServiceProvider? serviceProvider = null) where T : ModuleBase<SocketCommandContext>
        {
            return BuildHelp(typeof(T), serviceProvider);
        }

        public static (Dictionary<string, Embed> commandLookup, Embed commandListings) BuildHelp(Type module, IServiceProvider? serviceProvider = null)
        {
            var map = new Dictionary<string, Embed>();
            var commands = new List<CommandData>();

            foreach (var method in module.GetMethods(BindingFlags.Public | BindingFlags.Instance))
            {
                if (!method.CustomAttributes.Any(a => a.AttributeType == typeof(CommandAttribute)))
                {
                    continue;
                }

                var commandData = new CommandData();

                foreach (var attribute in method.GetCustomAttributes())
                {
                    switch (attribute)
                    {
                        case CommandAttribute command:
                            commandData.Name = command.Text;
                            break;
                        case SummaryAttribute summary:
                            commandData.Summary = summary.Text;
                            break;
                        case SummaryCallbackAttribute summaryCallback:
                            if (serviceProvider?.GetService(summaryCallback.Type) is ISummaryCallbackMessage message)
                            {
                                commandData.Summary = message.Message;
                            }
                            break;
                        case RemarksAttribute remarks:
                            commandData.Remark = remarks.Text;
                            break;
                        case ExampleAttribute exmaple:
                            commandData.Exmaples.Add(exmaple.Text);
                            break;
                        case AliasAttribute alias:
                            commandData.Alias = alias.Aliases;
                            break;
                        default:
                            break;
                    }
                }

                if (string.IsNullOrWhiteSpace(commandData.Name))
                {
                    continue;
                }

                foreach (var parameterInfo in method.GetParameters())
                {
                    var parameterData = new ParamaterData();
                    parameterData.Name = parameterInfo.Name;
                    parameterData.IsOptional = parameterInfo.IsOptional;

                    foreach (var attribute in parameterInfo.GetCustomAttributes())
                    {
                        switch (attribute)
                        {
                            case SummaryAttribute summary:
                                parameterData.Summary = summary.Text;
                                break;
                            case SummaryCallbackAttribute summaryCallback:
                                if (serviceProvider?.GetService(summaryCallback.Type) is ISummaryCallbackMessage message)
                                {
                                    parameterData.Summary = message.Message;
                                }
                                break;
                            default:
                                break;
                        }
                    }

                    commandData.Paramaters.Add(parameterData);
                }

                commands.Add(commandData);
            }

            foreach (var command in commands)
            {
                map[command.Name!] = new EmbedBuilder()
                {
                    Title = $"{Constants.DiscordBotCommandPrefix}{command.Name} {GetGetParametersNameString(command.Paramaters)}",
                    Description = GetDescriptionString(command),
                    Color = DiscordColors.infoColor,
                }
                .Build();

                foreach (var alias in command.Alias)
                {
                    map[alias] = map[command.Name!];
                }
            }

            var listings = new EmbedBuilder()
            {
                Title = Constants.DiscordBotCommandPrefix + "help [command_name]",
                Description = $"Shows Commands for this bot, use `{Constants.DiscordBotCommandPrefix}help <command_name>` for more details.",
                Color = DiscordColors.infoColor,
                Fields = commands.Select(c => new EmbedFieldBuilder()
                {
                    Name = $"**{map[c.Name!].Title}**",
                    Value = c.Summary ?? "missing summary"
                }).ToList()
            }.Build();

            return (map, listings);
        }

        private static string GetGetParametersNameString(List<ParamaterData> paramaters)
        {
            char OpenParamaterChar(ParamaterData data) => data.IsOptional ? '[' : '<';
            char CloseParamaterChar(ParamaterData data) => data.IsOptional ? ']' : '>';

            if (paramaters.Count == 0)
            {
                return "";
            }

            var sb = new StringBuilder();

            foreach (var p in paramaters)
            {
                sb.Append(OpenParamaterChar(p)).Append(p.Name).Append(CloseParamaterChar(p)).Append(", ");
            }

            if (sb.Length > 1)
            {
                sb.Remove(sb.Length - 2, 2);
            }

            return sb.ToString();
        }

        private static void DoAliases(StringBuilder sb, string[] aliases)
        {
            switch (aliases.Length)
            {
                case 0:
                    break;
                case 1:
                    sb.Append("__**Alias:**__ **").Append(Constants.DiscordBotCommandPrefix).Append(aliases[0]).Append("**\n\n");
                    break;
                default:
                    sb.Append("__**Aliases:**__ ");
                    foreach (var alias in aliases)
                    {
                        sb.Append("**").Append(Constants.DiscordBotCommandPrefix).Append(alias).Append("**, ");
                    }
                    sb.Remove(sb.Length - 2, 2);
                    sb.Append("\n\n");
                    break;
            }
        }

        private static void DoSummary(StringBuilder sb, string? summary)
        {
            if (!string.IsNullOrWhiteSpace(summary))
            {
                sb.Append(summary);
            }
        }

        private static void DoRemark(StringBuilder sb, string? remark)
        {
            if (!string.IsNullOrWhiteSpace(remark))
            {
                sb.Append("\n").Append(remark);
            }
        }

        private static void DoParametersDescription(StringBuilder sb, List<ParamaterData> paramaters)
        {
            if (paramaters.Count == 0)
            {
                return;
            }

            sb.AppendLine("\n\n__**Parameters:**__");

            foreach (var p in paramaters)
            {
                sb.Append("**").Append(p.Name).Append("**");
                if (p.IsOptional)
                {
                    sb.Append(" [Optional]");
                }
                sb.Append(" - ").Append(p.Summary).Append("\n");
            }
            sb.Remove(sb.Length - 1, 1);
        }

        private static void DoExamples(StringBuilder sb, string commandName, List<string> examples)
        {
            if (examples.Count == 0)
            {
                return;
            }
            sb.Append("\n\n__**Example Usage:**__\n```\n");

            foreach (var example in examples)
            {
                sb.Append(Constants.DiscordBotCommandPrefix).Append(commandName).Append(" ").Append(example).Append("\n");
            }
            sb.Append("```");
        }

        private static string GetDescriptionString(CommandData command)
        {
            var sb = new StringBuilder();

            DoAliases(sb, command.Alias);
            DoSummary(sb, command.Summary);
            DoRemark(sb, command.Remark);
            DoParametersDescription(sb, command.Paramaters);
            DoExamples(sb, command.Name!, command.Exmaples);

            return sb.ToString();
        }
    }
}
