using FactorioWebInterface.Hubs;
using FactorioWebInterface.Services;
using FactorioWebInterface.Utils.ProcessAbstractions;
using FactorioWebInterfaceTests.Utils;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using System;
using System.Collections.Generic;
using System.Text;

namespace FactorioWebInterfaceTests.Services.FactorioServerRunnerTests
{
    public static class FactorioServerRunnerHelper
    {
        public static FactorioServerRunner MakeFactorioServerRunner
        (
            IHubContext<FactorioControlHub, IFactorioControlClientMethods> factorioControlHub = null,
            IProcessSystem processSystem = null,
            ILogger<FactorioServerRunner> logger = null
        )
        {
            return new FactorioServerRunner
            (
                factorioControlHub ?? new Mock<IHubContext<FactorioControlHub, IFactorioControlClientMethods>>(MockBehavior.Strict).Object,
                processSystem ?? new Mock<IProcessSystem>(MockBehavior.Strict).Object,
                logger ?? new TestLogger<FactorioServerRunner>()
            );
        }
    }
}
