using FactorioWebInterface;
using FactorioWebInterface.Models;
using FactorioWebInterface.Services;
using FactorioWebInterface.Utils.ProcessAbstractions;
using FactorioWebInterfaceTests.Utils;
using Microsoft.Extensions.Logging;
using Moq;
using Serilog;
using Shared;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Text;
using Xunit;

namespace FactorioWebInterfaceTests.Services.FactorioServerRunnerTests
{
    public class Run
    {
        [Fact]
        public void WhenProcessStartsWithoutError()
        {
            // Arrange.
            var data = ServerDataHelper.MakeMutableData();
            data.Status = FactorioServerStatus.Prepared;

            var startInfo = new ProcessStartInfo("fileName", "arguments");

            var controlHub = new TestFactorioControlHub();

            var logger = new TestLogger<FactorioServerRunner>();

            var processSystemMock = new Mock<IProcessSystem>(MockBehavior.Strict);
            processSystemMock.Setup(x => x.Start(startInfo)).Returns((IProcess)null!).Verifiable();

            var runner = FactorioServerRunnerHelper.MakeFactorioServerRunner(factorioControlHub: controlHub, processSystem: processSystemMock.Object, logger: logger);

            // Act.
            var result = runner.Run(data, startInfo);

            // Assert.
            processSystemMock.Verify();

            Assert.True(result.Success);
            Assert.Equal(FactorioServerStatus.WrapperStarting, data.Status);

            logger.AssertContainsLog(LogLevel.Information, "Wrapper process started, fileName: fileName, arguments: arguments");
            controlHub.AssertContainsStatusMessage(data.ServerId, FactorioServerStatus.Prepared, FactorioServerStatus.WrapperStarting);
        }

        [Fact]
        public void WhenProcessStartsWithError()
        {
            // Arrange.
            var data = ServerDataHelper.MakeMutableData();
            data.Status = FactorioServerStatus.Prepared;

            var startInfo = new ProcessStartInfo("fileName", "arguments");

            var controlHub = new TestFactorioControlHub();

            var logger = new TestLogger<FactorioServerRunner>();

            var processSystemMock = new Mock<IProcessSystem>(MockBehavior.Strict);
            processSystemMock.Setup(x => x.Start(startInfo)).Throws(new Exception("error")).Verifiable();

            var runner = FactorioServerRunnerHelper.MakeFactorioServerRunner(factorioControlHub: controlHub, processSystem: processSystemMock.Object, logger: logger);

            // Act.
            var result = runner.Run(data, startInfo);

            // Assert.
            processSystemMock.Verify();

            Assert.False(result.Success);
            Assert.Equal($"{Constants.WrapperProcessErrorKey}: Wrapper process failed to start.", result.ToString());

            Assert.Equal(FactorioServerStatus.Errored, data.Status);

            logger.AssertContainsLog(LogLevel.Error, "Error starting wrapper process, fileName: fileName, arguments: arguments");
            controlHub.AssertContainsStatusMessage(data.ServerId, FactorioServerStatus.Prepared, FactorioServerStatus.Errored);
        }
    }
}
