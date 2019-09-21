using FactorioWebInterface.Models;
using System;
using System.Collections.Generic;
using System.Text;

namespace FactorioWebInterfaceTests.Utils
{
    public static class ServerDataHelper
    {
        public static FactorioServerData MakeServerData(Action<FactorioServerMutableData> mutableDataBuilder,
            int serverNumber = 1,
            string baseFactorioDirectoryPath = "/factorio",
            int bufferSize = 100)
        {
            var c = new FactorioServerConstantData(serverNumber, baseFactorioDirectoryPath);
            var md = new FactorioServerMutableData(c, bufferSize);

            mutableDataBuilder(md);

            return new FactorioServerData(md);
        }
    }
}
