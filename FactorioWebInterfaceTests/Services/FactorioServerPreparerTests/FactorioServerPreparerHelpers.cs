using FactorioWebInterface.Data;
using FactorioWebInterface.Hubs;
using FactorioWebInterface.Services;
using FactorioWebInterfaceTests.Utils;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using System;
using System.Collections.Generic;
using System.Text;

namespace FactorioWebInterfaceTests.Services.FactorioServerPreparerTests
{
    public static class FactorioServerPreparerHelpers
    {
        public static FactorioServerPreparer MakeFactorioServerPreparer
        (
            IFactorioServerDataService factorioServerDataService = null,
            IFactorioAdminManager factorioAdminManager = null,
            IFactorioModManager factorioModManager = null,
            IFactorioBanService factorioBanService = null,
            IHubContext<FactorioControlHub, IFactorioControlClientMethods> factorioControlHub = null,
            IFactorioFileManager factorioFileManager = null,
            ILogger<FactorioServerPreparer> logger = null
        )
        {
            return new FactorioServerPreparer
            (
                factorioServerDataService ?? new Mock<IFactorioServerDataService>(MockBehavior.Strict).Object,
                factorioAdminManager ?? new Mock<IFactorioAdminManager>(MockBehavior.Strict).Object,
                factorioModManager ?? new Mock<IFactorioModManager>(MockBehavior.Strict).Object,
                factorioBanService ?? new Mock<IFactorioBanService>(MockBehavior.Strict).Object,
                factorioControlHub ?? new Mock<IHubContext<FactorioControlHub, IFactorioControlClientMethods>>(MockBehavior.Strict).Object,
                factorioFileManager ?? new Mock<IFactorioFileManager>(MockBehavior.Strict).Object,
                logger ?? new TestLogger<FactorioServerPreparer>()
            );
        }
    }
}
