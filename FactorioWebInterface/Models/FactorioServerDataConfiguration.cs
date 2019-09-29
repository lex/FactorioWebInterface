using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FactorioWebInterface.Models
{
    public class FactorioServerDataConfiguration
    {
        public int ServerCount { get; } = 10;
        public int BufferSize { get; } = 200;
        public int MaxLogFiles { get; } = 10;

        public string FactorioWrapperName { get; }

        public FactorioServerDataConfiguration(IConfiguration configuration)
        {
            FactorioWrapperName = configuration[Constants.FactorioWrapperNameKey];
            if (string.IsNullOrWhiteSpace(FactorioWrapperName))
            {
                FactorioWrapperName = "factorioWrapper";
            }
        }
    }
}
