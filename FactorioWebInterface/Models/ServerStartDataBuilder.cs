using System;

namespace FactorioWebInterface.Models
{
    public static class ServerStartDataBuilder
    {
        public const string SetStartDataCommandName = "set_start_data";

        public static string BuildCommand(FactorioServerData serverData)
        {
            var timeStamp = (int)(serverData.StartTime - DateTime.UnixEpoch).TotalSeconds;

            var command = FactorioCommandBuilder.ServerCommand(SetStartDataCommandName)
                .Add("{server_id=").AddQuotedString(serverData.ServerId)
                .Add(",start_time=").Add(timeStamp);

            if (serverData.RunningName is string name)
            {
                command = command.Add(",server_name=").AddQuotedString(name);
            }

            return command.Add("}").Build();
        }
    }
}
