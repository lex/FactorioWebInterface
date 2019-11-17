using Discord;
using Discord.Commands;
using DSharpPlus.CommandsNext;
using FactorioWebInterface.Models;
using FactorioWebInterface.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace FactorioWebInterface.Services.Discord
{
    public static class DiscordBotCommandHelpBuilder
    {
        private class CommandData
        {
            public string? Name { get; set; }
            public string? Summary { get; set; }
            public string? Remark { get; set; }
            public string? Exmaple { get; set; }
            public List<ParamaterData> Paramaters { get; } = new List<ParamaterData>();
        }

        private class ParamaterData
        {
            public string? Name { get; set; }
            public string? Summary { get; set; }
            public bool IsOptional { get; set; }
        }

        public static Dictionary<string, Embed> BuildHelp<T>() where T : ModuleBase<SocketCommandContext>
        {
            return BuildHelp(typeof(T));
        }

        public static Dictionary<string, Embed> BuildHelp(Type module)
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
                        case RemarksAttribute remarks:
                            commandData.Remark = remarks.Text;
                            break;
                        case ExampleAttribute exmaple:
                            commandData.Exmaple = exmaple.Text;
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
            }

            map["help"] = new EmbedBuilder()
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

            return map;
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

        private static void DoParametersDescription(StringBuilder sb, List<ParamaterData> paramaters)
        {
            if (paramaters.Count == 0)
            {
                return;
            }

            sb.AppendLine("\n\n__**Parameters:**__");

            foreach (var p in paramaters)
            {
                sb.Append("**").Append(p.Name).Append("**").Append(" - ").Append(p.Summary).Append("\n");
            }
            sb.Remove(sb.Length - 1, 1);
        }

        private static string GetDescriptionString(CommandData command)
        {
            var sb = new StringBuilder();

            if (!string.IsNullOrWhiteSpace(command.Summary))
            {
                sb.Append(command.Summary);
            }

            if (!string.IsNullOrWhiteSpace(command.Remark))
            {
                sb.Append("\n").Append(command.Remark);
            }

            DoParametersDescription(sb, command.Paramaters);

            if (command.Exmaple != null)
            {
                sb.Append("\n\n**Example Usage:**\n```\n").Append(Constants.DiscordBotCommandPrefix).Append(command.Name).Append(" ").Append(command.Exmaple).Append("\n```");
            }

            return sb.ToString();
        }
    }
}
