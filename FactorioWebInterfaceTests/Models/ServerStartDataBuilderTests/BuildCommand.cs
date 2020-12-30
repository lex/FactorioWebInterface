using FactorioWebInterface.Models;
using FactorioWebInterfaceTests.Utils;
using System;
using Xunit;

namespace FactorioWebInterfaceTests.Models.ServerStartDataBuilderTests
{
    public sealed class BuildCommand
    {
        [Fact]
        public void AllValuesCorrect()
        {
            // Arrange.
            DateTime startTime = DateTime.UnixEpoch + TimeSpan.FromSeconds(100);

            var serverData = ServerDataHelper.MakeServerData(
                md =>
                {
                    md.ServerRunningSettings = new FactorioServerSettings() { Name = "Server name" };
                    md.StartTime = startTime;
                },
                serverNumber: 1);

            // Act.
            string command = ServerStartDataBuilder.BuildCommand(serverData);

            // Assert.
            const string Expected = @"/silent-command local s = ServerCommands s = s and s.set_start_data({server_id='1',start_time=100,server_name='Server name'})";
            Assert.Equal(Expected, command);
        }

        [Fact]
        public void EspacesQuotesInServerName()
        {
            // Arrange.
            DateTime startTime = DateTime.UnixEpoch + TimeSpan.FromSeconds(100);

            var serverData = ServerDataHelper.MakeServerData(
                md =>
                {
                    md.ServerRunningSettings = new FactorioServerSettings() { Name = @"Server's name\'" };
                    md.StartTime = startTime;
                },
                serverNumber: 1);

            // Act.
            string command = ServerStartDataBuilder.BuildCommand(serverData);

            // Assert.
            const string Expected = @"/silent-command local s = ServerCommands s = s and s.set_start_data({server_id='1',start_time=100,server_name='Server\'s name\\\''})";
            Assert.Equal(Expected, command);
        }

        [Fact]
        public void SkipsNameWhenNull()
        {
            // Arrange.
            DateTime startTime = DateTime.UnixEpoch + TimeSpan.FromSeconds(100);

            var serverData = ServerDataHelper.MakeServerData(
                md =>
                {
                    md.StartTime = startTime;
                },
                serverNumber: 1);

            // Act.
            string command = ServerStartDataBuilder.BuildCommand(serverData);

            // Assert.
            const string Expected = @"/silent-command local s = ServerCommands s = s and s.set_start_data({server_id='1',start_time=100})";
            Assert.Equal(Expected, command);
        }
    }
}
