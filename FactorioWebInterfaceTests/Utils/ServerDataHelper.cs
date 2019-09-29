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
            var md = MakeMutableData(serverNumber, baseFactorioDirectoryPath, bufferSize);
            mutableDataBuilder(md);
            return new FactorioServerData(md);
        }

        public static FactorioServerMutableData MakeMutableData(int serverNumber = 1,
            string baseFactorioDirectoryPath = "/factorio",
            int bufferSize = 100)
        {
            var c = new FactorioServerConstantData(serverNumber, baseFactorioDirectoryPath);
            return new FactorioServerMutableData(c, bufferSize);
        }
    }
}
